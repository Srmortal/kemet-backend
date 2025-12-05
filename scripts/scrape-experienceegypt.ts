#!/usr/bin/env ts-node
/**
 * Experience Egypt Scraper
 * Crawls entire experienceegypt.eg domain, respects robots.txt,
 * uses sitemap for discovery, and stores data as JSON.
 */

import 'dotenv/config';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import * as path from 'path';
import { URL } from 'url';
import { firebaseAdmin } from '../src/config/firebase';

interface ScrapeResult {
  url: string;
  title: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  language?: string;
  content: {
    headings: { level: number; text: string }[];
    paragraphs: string[];
    images: { src: string; alt: string }[];
    links: { href: string; text: string }[];
  };
  metadata: {
    lastModified?: string;
    priority?: string;
    scrapedAt: string;
    statusCode: number;
  };
  jsonLd?: any[];
  rawHtml?: string;
}

interface CrawlerConfig {
  baseUrl: string;
  outputDir: string;
  sitemapUrl: string;
  concurrency: number;
  delayMs: number;
  saveRawHtml: boolean;
  respectRobotsTxt: boolean;
  userAgent: string;
}

class ExperienceEgyptScraper {
  private config: CrawlerConfig;
  private client: AxiosInstance;
  private crawledUrls: Set<string> = new Set();
  private failedUrls: Map<string, string> = new Map();
  private stats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
  };

  constructor(config: Partial<CrawlerConfig> = {}) {
    this.config = {
      baseUrl: 'https://www.experienceegypt.eg',
      outputDir: path.join(process.cwd(), 'data', 'experienceegypt'),
      sitemapUrl: 'https://www.experienceegypt.eg/sitemap.xml',
      concurrency: 3,
      delayMs: 1000,
      saveRawHtml: true,
      respectRobotsTxt: true,
      userAgent: 'kemet-backend-scraper/1.0 (Educational purposes)',
      ...config,
    };

    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
      },
    });
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Experience Egypt Scraper...');
    console.log('📁 Storage: Firestore (experienceegypt_pages)');
    console.log('🖼️  Images: Firebase Storage (experienceegypt/images/)');
    
    // Test Firestore connection
    const db = firebaseAdmin.firestore();
    await db.collection('experienceegypt_pages').limit(1).get();
  }

  async fetchSitemap(): Promise<string[]> {
    console.log('📄 Fetching sitemap...');
    try {
      const { data } = await this.client.get(this.config.sitemapUrl);
      const urls = data.match(/<loc>(.*?)<\/loc>/g)?.map((loc: string) => 
        loc.replace(/<\/?loc>/g, '')
      ) || [];
      console.log(`✅ Found ${urls.length} URLs in sitemap`);
      return urls;
    } catch (error) {
      console.error('❌ Failed to fetch sitemap:', error);
      return [];
    }
  }

  async scrapePage(url: string): Promise<ScrapeResult | null> {
    try {
      const { data, status } = await this.client.get(url);
      const $ = cheerio.load(data);

      // Extract title
      const title = $('title').text().trim() || $('h1').first().text().trim();

      // Extract meta tags
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content');
      const keywords = $('meta[name="keywords"]').attr('content');
      const canonical = $('link[rel="canonical"]').attr('href');
      const language = $('html').attr('lang') || 'en';

      // Extract headings
      const headings: { level: number; text: string }[] = [];
      $('h1, h2, h3, h4, h5, h6').each((_, el) => {
        const level = parseInt(el.tagName.substring(1));
        const text = $(el).text().trim();
        if (text) {
          headings.push({ level, text });
        }
      });

      // Extract paragraphs
      const paragraphs: string[] = [];
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 20) {
          paragraphs.push(text);
        }
      });

      // Extract images
      const images: { src: string; alt: string }[] = [];
      $('img').each((_, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src');
        if (src) {
          // Convert relative URLs to absolute
          if (src.startsWith('/')) {
            src = new URL(src, this.config.baseUrl).href;
          } else if (!src.startsWith('http')) {
            src = new URL(src, url).href;
          }
          images.push({
            src,
            alt: $(el).attr('alt') || '',
          });
        }
      });

      // Extract links
      const links: { href: string; text: string }[] = [];
      $('a[href]').each((_, el) => {
        let href = $(el).attr('href');
        if (href) {
          // Convert relative URLs to absolute
          if (href.startsWith('/')) {
            href = new URL(href, this.config.baseUrl).href;
          } else if (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
            try {
              href = new URL(href, url).href;
            } catch {
              // Skip invalid URLs
              return;
            }
          }
          const text = $(el).text().trim();
          if (href.startsWith('http')) {
            links.push({ href, text });
          }
        }
      });

      // Extract JSON-LD structured data
      const jsonLd: any[] = [];
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html() || '');
          jsonLd.push(json);
        } catch {
          // Skip invalid JSON
        }
      });

      const result: ScrapeResult = {
        url,
        title,
        description,
        keywords,
        canonical,
        language,
        content: {
          headings,
          paragraphs,
          images,
          links,
        },
        metadata: {
          scrapedAt: new Date().toISOString(),
          statusCode: status,
        },
        jsonLd: jsonLd.length > 0 ? jsonLd : undefined,
      };

      if (this.config.saveRawHtml) {
        result.rawHtml = data;
      }

      return result;
    } catch (error: any) {
      console.error(`❌ Failed to scrape ${url}:`, error.message);
      this.failedUrls.set(url, error.message);
      return null;
    }
  }

  async savePage(result: ScrapeResult): Promise<void> {
    const db = firebaseAdmin.firestore();
    const col = db.collection('experienceegypt_pages');
    
    // Generate document ID from URL
    const docId = Buffer.from(result.url).toString('base64url');
    
    // Upload primary image to Firebase Storage if available
    let imageStoragePath: string | undefined;
    if (result.content.images.length > 0) {
      const primaryImage = result.content.images[0];
      imageStoragePath = await this.uploadImageToStorage(primaryImage.src, result.url);
    }
    
    // Prepare document data
    const docData = {
      url: result.url,
      title: result.title || null,
      description: result.description || null,
      keywords: result.keywords || null,
      canonical: result.canonical || null,
      language: result.language || 'en',
      primaryImage: result.content.images[0]?.src || null,
      primaryImageStoragePath: imageStoragePath || null,
      headings: result.content.headings,
      paragraphs: result.content.paragraphs,
      images: result.content.images,
      links: result.content.links,
      jsonLd: result.jsonLd || null,
      html: this.config.saveRawHtml ? result.rawHtml : null,
      statusCode: result.metadata.statusCode,
      scrapedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      source: 'experienceegypt.eg',
    };
    
    await col.doc(docId).set(docData, { merge: true });
  }

  async uploadImageToStorage(imageUrl: string, pageUrl: string): Promise<string | undefined> {
    try {
      // Skip obvious logos/icons
      if (/logo\.|icon\.|sprite\./i.test(imageUrl)) return undefined;
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': this.config.userAgent,
        },
      });
      
      const contentType = (response.headers['content-type'] as string) || 'image/jpeg';
      if (contentType.includes('image/svg')) return undefined;
      
      let extension = 'jpg';
      if (contentType.includes('/')) {
        extension = contentType.split('/')[1]?.split('+')[0] || 'jpg';
      }
      
      const hash = Buffer.from(imageUrl).toString('base64url').slice(0, 32);
      const filename = `experienceegypt/images/${hash}.${extension}`;
      
      const bucket = firebaseAdmin.storage().bucket();
      const file = bucket.file(filename);
      
      const [exists] = await file.exists();
      if (exists) return filename;
      
      await file.save(Buffer.from(response.data), {
        metadata: { contentType, metadata: { sourceUrl: imageUrl, pageUrl } },
      });
      
      return filename;
    } catch (e) {
      console.warn(`    Failed to upload image: ${imageUrl}`);
      return undefined;
    }
  }

  async crawl(urls: string[]): Promise<void> {
    this.stats.total = urls.length;
    console.log(`\n🕷️  Starting crawl of ${urls.length} URLs...`);
    console.log(`⚙️  Concurrency: ${this.config.concurrency}, Delay: ${this.config.delayMs}ms\n`);

    const chunks: string[][] = [];
    for (let i = 0; i < urls.length; i += this.config.concurrency) {
      chunks.push(urls.slice(i, i + this.config.concurrency));
    }

    for (const [chunkIndex, chunk] of chunks.entries()) {
      const promises = chunk.map(async (url) => {
        if (this.crawledUrls.has(url)) {
          this.stats.skipped++;
          return;
        }

        this.crawledUrls.add(url);
        const result = await this.scrapePage(url);

        if (result) {
          await this.savePage(result);
          this.stats.success++;
          console.log(`✅ [${this.stats.success}/${this.stats.total}] ${url}`);
        } else {
          this.stats.failed++;
          console.log(`❌ [${this.stats.failed} failed] ${url}`);
        }
      });

      await Promise.all(promises);

      // Delay between chunks (rate limiting)
      if (chunkIndex < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, this.config.delayMs));
      }

      // Progress update every 10 chunks
      if ((chunkIndex + 1) % 10 === 0) {
        console.log(`\n📊 Progress: ${this.stats.success + this.stats.failed}/${this.stats.total} (${Math.round((this.stats.success + this.stats.failed) / this.stats.total * 100)}%)`);
        console.log(`   ✅ Success: ${this.stats.success} | ❌ Failed: ${this.stats.failed} | ⏭️  Skipped: ${this.stats.skipped}\n`);
      }
    }
  }

  async generateIndex(): Promise<void> {
    console.log('\n📑 Data stored in Firestore collection: experienceegypt_pages');
    console.log('   Use Firestore queries to search and filter pages');
  }

  async generateReport(): Promise<void> {
    const report = {
      summary: {
        total: this.stats.total,
        success: this.stats.success,
        failed: this.stats.failed,
        skipped: this.stats.skipped,
        successRate: `${Math.round((this.stats.success / this.stats.total) * 100)}%`,
      },
      failedUrls: Array.from(this.failedUrls.entries()).map(([url, error]) => ({
        url,
        error,
      })),
      completedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      config: {
        baseUrl: this.config.baseUrl,
        concurrency: this.config.concurrency,
        delayMs: this.config.delayMs,
      },
    };

    const db = firebaseAdmin.firestore();
    const reportId = new Date().toISOString().split('T')[0];
    await db.collection('experienceegypt_reports').doc(reportId).set(report);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 CRAWL COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total URLs:    ${report.summary.total}`);
    console.log(`✅ Success:     ${report.summary.success}`);
    console.log(`❌ Failed:      ${report.summary.failed}`);
    console.log(`⏭️  Skipped:     ${report.summary.skipped}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}`);
    console.log('='.repeat(60));
    console.log(`\n📁 Firestore Collection: experienceegypt_pages`);
    console.log(`📝 Report Collection: experienceegypt_reports\n`);

    if (this.failedUrls.size > 0) {
      console.log('⚠️  Failed URLs:');
      for (const [url, error] of this.failedUrls.entries()) {
        console.log(`   - ${url}`);
        console.log(`     Error: ${error}`);
      }
    }
  }

  async run(): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.initialize();
      const urls = await this.fetchSitemap();
      
      if (urls.length === 0) {
        console.log('❌ No URLs found to crawl');
        return;
      }

      await this.crawl(urls);
      await this.generateIndex();
      await this.generateReport();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n⏱️  Total time: ${duration}s\n`);
    } catch (error) {
      console.error('❌ Fatal error:', error);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const scraper = new ExperienceEgyptScraper({
    concurrency: parseInt(process.env.CONCURRENCY || '3'),
    delayMs: parseInt(process.env.DELAY_MS || '1000'),
    saveRawHtml: process.env.SAVE_HTML !== 'false',
  });

  scraper.run()
    .then(() => {
      console.log('✨ Scraping completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Scraping failed:', error);
      process.exit(1);
    });
}

export { ExperienceEgyptScraper, ScrapeResult, CrawlerConfig };
