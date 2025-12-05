import 'dotenv/config';
import axios from 'axios';
import https from 'https';
import * as cheerio from 'cheerio';
import { firebaseAdmin } from '../src/config/firebase';

// Use CommonJS require to access class constructor from pdf-parse
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { PDFParse } from 'pdf-parse';

/**
 * Enhanced scraper that extracts data from PDFs and follows external references
 */

type PageDoc = {
  url: string;
  title?: string;
  h1?: string;
  description?: string;
  keywords?: string;
  author?: string;
  publishDate?: string;
  image?: string;
  imageStoragePath?: string;
  allImages: string[];
  text?: string;
  html?: string;
  headings: { level: number; text: string }[];
  lists: string[];
  tables: string[];
  categories?: string[];
  tags?: string[];
  links: string[];
  pdfContent?: string[]; // Text extracted from linked PDFs
  externalReferences?: ExternalReference[]; // Data from external links
  statusCode?: number;
};

type ExternalReference = {
  url: string;
  title?: string;
  description?: string;
  text?: string;
  type: 'webpage' | 'pdf' | 'unknown';
};

const TRUSTED_DOMAINS = [
  'wikipedia.org',
  'britannica.com',
  'nationalgeographic.com',
  'archaeology.org',
  'ancient.eu',
  'worldhistory.org',
  'unesco.org',
  'metmuseum.org',
  'britishmuseum.org',
  'louvre.fr',
];

async function fetchPage(url: string) {
  const res = await axios.get(url, {
    timeout: 60000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    validateStatus: (status) => status < 500,
  });
  return { html: res.data as string, statusCode: res.status };
}

function absoluteUrl(base: string, href?: string): string | undefined {
  if (!href) return undefined;
  if (href.startsWith('http')) return href;
  if (href.startsWith('//')) return `https:${href}`;
  try {
    return new URL(href, base).toString();
  } catch {
    return undefined;
  }
}

function isTrustedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return TRUSTED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

async function extractPdfContent(pdfUrl: string): Promise<string | undefined> {
  try {
    console.log(`  Extracting PDF: ${pdfUrl}`);
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      maxContentLength: 10 * 1024 * 1024, // 10MB limit
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      },
    });

    const parser = new PDFParse({ data: Buffer.from(response.data) });
    const textRes = await parser.getText();
    const text = (textRes?.text || '').trim();
    await parser.destroy().catch(() => {});
    
    if (text && text.length > 20) {  // Lower threshold - even minimal text is useful
      console.log(`    ✓ Extracted ${text.length} characters from PDF`);
      return text.slice(0, 50000); // Limit to 50KB
    }
    
    console.log(`    ✗ PDF extracted but text too short (${text.length} chars) - likely image-based`);
    return undefined;
  } catch (e) {
    const err = e as Error;
    console.warn(`    ✗ Failed to extract PDF: ${err.message}`);
    if (err.stack) console.warn(`    Stack: ${err.stack.split('\n')[1]?.trim()}`);
    return undefined;
  }
}

async function fetchExternalReference(url: string): Promise<ExternalReference | undefined> {
  try {
    console.log(`  Fetching external reference: ${url}`);
    
    // Check if PDF
    if (url.toLowerCase().endsWith('.pdf')) {
      const text = await extractPdfContent(url);
      return {
        url,
        text,
        type: 'pdf',
      };
    }

    // Fetch webpage
    const response = await axios.get(url, {
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      validateStatus: (status) => status < 500,
    });

    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, .menu, .navigation, .sidebar').remove();
    
    const title = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');
    
    // Extract main content
    const textParts: string[] = [];
    const contentSelectors = ['article', 'main', '[role="main"]', '.content', '.post-content', '.entry-content'];
    
    for (const selector of contentSelectors) {
      const content = $(selector).first();
      if (content.length) {
        const text = content.text().trim();
        if (text.length > 200) {
          textParts.push(text);
          break;
        }
      }
    }
    
    // Fallback to paragraphs
    if (!textParts.length) {
      $('p').each((_i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50) textParts.push(text);
      });
    }
    
    const text = textParts.join('\n\n').slice(0, 10000); // Limit to 10KB per external reference
    
    console.log(`    ✓ Extracted ${text.length} characters`);
    
    return {
      url,
      title,
      description,
      text: text || undefined,
      type: 'webpage',
    };
  } catch (e) {
    console.warn(`    ✗ Failed to fetch external reference: ${(e as Error).message}`);
    return undefined;
  }
}

async function downloadAndStoreImage(imageUrl: string, pageUrl: string): Promise<string | undefined> {
  try {
    // Skip obvious non-content or vector logos/icons
    if (/logo\.|icon\.|sprite\./i.test(imageUrl)) return undefined;
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    
    const contentType = (response.headers['content-type'] as string) || 'image/jpeg';
    // Skip SVGs (often logos) to reduce noise
    if (contentType.includes('image/svg')) return undefined;
    let extension = 'jpg';
    if (contentType.includes('/')) {
      extension = contentType.split('/')[1]?.split('+')[0] || 'jpg';
    }
    const hash = Buffer.from(imageUrl).toString('base64url').slice(0, 32);
    const filename = `egymonuments/images/${hash}.${extension}`;
    
    const bucket = firebaseAdmin.storage().bucket();
    const file = bucket.file(filename);
    
    // Check if already exists
    const [exists] = await file.exists();
    if (exists) return filename;
    
    await file.save(Buffer.from(response.data), {
      metadata: { contentType, metadata: { sourceUrl: imageUrl, pageUrl } },
    });
    
    return filename;
  } catch (e) {
    console.warn(`Failed to store image: ${imageUrl}`);
    return undefined;
  }
}

async function parsePage(url: string): Promise<PageDoc> {
  const { html, statusCode } = await fetchPage(url);
  const $ = cheerio.load(html);

  const title = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
  const h1 = $('h1').first().text().trim();
  const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || $('article p').first().text().trim() || $('p').first().text().trim();
  const keywords = $('meta[name="keywords"]').attr('content');
  const author = $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content');
  const publishDate = $('meta[property="article:published_time"]').attr('content') || $('time').attr('datetime');
  
  // Extract categories and tags
  const categories: string[] = [];
  const tags: string[] = [];
  $('a[rel="category"], .category, .post-category').each((_i, el) => {
    const cat = $(el).text().trim();
    if (cat) categories.push(cat);
  });
  $('a[rel="tag"], .tag, .post-tag').each((_i, el) => {
    const tag = $(el).text().trim();
    if (tag) tags.push(tag);
  });
  
  // Get primary image
  const ogImage = $('meta[property="og:image"]').attr('content');
  const twitterImage = $('meta[name="twitter:image"]').attr('content');
  const heroImg = $('img').first().attr('src');
  const image = absoluteUrl(url, ogImage || twitterImage || heroImg);
  
  // Collect all images
  const allImages: string[] = [];
  $('img').each((_i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    const abs = absoluteUrl(url, src);
    if (abs) allImages.push(abs);
  });
  
  // Download and store primary image
  let imageStoragePath: string | undefined;
  if (image) {
    imageStoragePath = await downloadAndStoreImage(image, url);
  }
  
  // Extract headings structure
  const headings: { level: number; text: string }[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_i, el) => {
    const level = parseInt(el.tagName[1]);
    const text = $(el).text().trim();
    if (text) headings.push({ level, text });
  });
  
  // Extract lists
  const lists: string[] = [];
  $('ul, ol').each((_i, el) => {
    const items: string[] = [];
    $(el).find('li').each((_j, li) => {
      const item = $(li).text().trim();
      if (item) items.push(item);
    });
    if (items.length) lists.push(items.join(' | '));
  });
  
  // Extract tables
  const tables: string[] = [];
  $('table').each((_i, el) => {
    const rows: string[] = [];
    $(el).find('tr').each((_j, tr) => {
      const cells: string[] = [];
      $(tr).find('td, th').each((_k, cell) => {
        cells.push($(cell).text().trim());
      });
      if (cells.length) rows.push(cells.join(' | '));
    });
    if (rows.length) tables.push(rows.join('\n'));
  });

  // Collect internal and external links
  const links: string[] = [];
  const pdfLinks: string[] = [];
  const externalLinks: string[] = [];
  
  $('a').each((_i, el) => {
    const href = $(el).attr('href');
    const abs = absoluteUrl(url, href);
    if (!abs) return;
    
    try {
      const linkUrl = new URL(abs);
      const baseUrl = new URL(url);
      
      // PDF links
      if (abs.toLowerCase().endsWith('.pdf')) {
        pdfLinks.push(abs);
        return;
      }
      
      // Internal links
      if (linkUrl.hostname === baseUrl.hostname) {
        const cleanUrl = abs.split('#')[0].split('?')[0];
        links.push(cleanUrl);
      } 
      // External trusted domain links
      else if (isTrustedDomain(abs)) {
        externalLinks.push(abs);
      }
    } catch {
      // Ignore invalid URLs
    }
  });

  // Extract text from PDFs (limit to 3 PDFs per page)
  const pdfContent: string[] = [];
  const pdfsToProcess = pdfLinks.slice(0, 3);
  
  if (pdfsToProcess.length > 0) {
    console.log(`  Found ${pdfsToProcess.length} PDF(s) to process`);
    for (const pdfUrl of pdfsToProcess) {
      const content = await extractPdfContent(pdfUrl);
      if (content) {
        pdfContent.push(`Source: ${pdfUrl}\n\n${content}`);
      }
      // Small delay between PDFs
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Fetch external references (limit to 2 per page)
  const externalReferences: ExternalReference[] = [];
  const referencesToProcess = externalLinks.slice(0, 2);
  
  if (referencesToProcess.length > 0) {
    console.log(`  Found ${referencesToProcess.length} external reference(s) to fetch`);
    for (const extUrl of referencesToProcess) {
      const ref = await fetchExternalReference(extUrl);
      if (ref) {
        externalReferences.push(ref);
      }
      // Small delay between requests
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Extract comprehensive text
  const textParts: string[] = [];
  $('article, main, .content, .post-content, .entry-content').each((_i, el) => {
    const txt = $(el).text().trim();
    if (txt) textParts.push(txt);
  });
  if (!textParts.length) {
    $('p').each((_i, el) => {
      const txt = $(el).text().trim();
      if (txt) textParts.push(txt);
    });
  }
  const text = textParts.join('\n\n').slice(0, 50000);
  
  // Store full HTML content (remove scripts and styles)
  $('script, style, noscript').remove();
  const contentHtml = $('article, main, .content, .post-content, .entry-content').html() || $('body').html() || '';

  return { 
    url, 
    title, 
    h1, 
    description, 
    keywords, 
    author, 
    publishDate, 
    image, 
    imageStoragePath,
    allImages: Array.from(new Set(allImages)),
    text, 
    html: contentHtml?.slice(0, 100000),
    headings,
    lists,
    tables,
    categories: Array.from(new Set(categories)),
    tags: Array.from(new Set(tags)),
    links: Array.from(new Set(links)),
    pdfContent: pdfContent.length > 0 ? pdfContent : undefined,
    externalReferences: externalReferences.length > 0 ? externalReferences : undefined,
    statusCode 
  };
}

async function crawlSite(startUrl: string, maxPages?: number) {
  const start = new URL(startUrl);
  const origin = `${start.protocol}//${start.hostname}`;
  const queue: string[] = [startUrl];
  const visited = new Set<string>();
  const results: PageDoc[] = [];
  const failed: string[] = [];

  console.log(`Starting enhanced deep crawl from ${startUrl}`);
  console.log(`Max pages: ${maxPages || 'unlimited'}`);
  console.log(`Features: PDF extraction + External references from trusted domains`);

  while (queue.length && (!maxPages || results.length < maxPages)) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      console.log(`[${results.length + 1}] Crawling: ${url}`);
      const doc = await parsePage(url);
      results.push(doc);

      // Progress logging
      if (results.length % 10 === 0) {
        console.log(`\nProgress: ${results.length} pages | Queue: ${queue.length} | Failed: ${failed.length}\n`);
      }

      // Enqueue new links under same origin
      for (const link of doc.links) {
        if (visited.has(link)) continue;
        if (!link.startsWith(origin)) continue;
        // Skip assets, feeds, and common non-content paths
        if (/\.(jpg|jpeg|png|gif|svg|pdf|css|js|xml|json|txt|zip|rar)(\?.*)?$/i.test(link)) continue;
        if (/\/(feed|rss|wp-json|wp-admin|wp-content|wp-includes)\//.test(link)) continue;
        queue.push(link);
      }
      
      // Politeness delay
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      failed.push(url);
      console.warn(`[${results.length}] Failed: ${url} - ${(e as Error).message}`);
    }
  }
  
  console.log(`\nCrawl complete:`);
  console.log(`  Success: ${results.length} pages`);
  console.log(`  Failed: ${failed.length} pages`);
  console.log(`  Remaining queue: ${queue.length}`);
  
  // Detailed stats
  const pagesWithPdf = results.filter(r => r.pdfContent && r.pdfContent.length > 0);
  const totalPdfs = pagesWithPdf.reduce((sum, r) => sum + (r.pdfContent?.length || 0), 0);
  const pagesWithExternal = results.filter(r => r.externalReferences && r.externalReferences.length > 0);
  const totalExternal = pagesWithExternal.reduce((sum, r) => sum + (r.externalReferences?.length || 0), 0);
  
  console.log(`  Pages with PDF content: ${pagesWithPdf.length} (${totalPdfs} PDFs total)`);
  console.log(`  Pages with external references: ${pagesWithExternal.length} (${totalExternal} references total)`);
  
  return results;
}

async function saveToFirestore(items: PageDoc[]) {
  const db = firebaseAdmin.firestore();
  const col = db.collection('egymonuments_pages_enhanced');
  
  console.log(`\nSaving ${items.length} pages to Firestore (egymonuments_pages_enhanced)...`);
  
  const batchSize = 500;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = db.batch();
    const chunk = items.slice(i, i + batchSize);
    
    for (const m of chunk) {
      const id = Buffer.from(m.url).toString('base64url');
      const ref = col.doc(id);
      batch.set(ref, {
        url: m.url,
        title: m.title || null,
        h1: m.h1 || null,
        description: m.description || null,
        keywords: m.keywords || null,
        author: m.author || null,
        publishDate: m.publishDate || null,
        image: m.image || null,
        imageStoragePath: m.imageStoragePath || null,
        allImages: m.allImages || [],
        text: m.text || null,
        html: m.html || null,
        headings: m.headings || [],
        lists: m.lists || [],
        tables: m.tables || [],
        categories: m.categories || [],
        tags: m.tags || [],
        links: m.links,
        pdfContent: m.pdfContent || null,
        externalReferences: m.externalReferences || null,
        statusCode: m.statusCode || null,
        source: 'egymonuments.com',
        enhanced: true,
        fetchedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    
    await batch.commit();
    console.log(`  Saved batch ${Math.floor(i / batchSize) + 1} (${chunk.length} items)`);
  }
}

async function main() {
  const START = 'https://egymonuments.com/';
  console.log('='.repeat(70));
  console.log('EGYMONUMENTS.COM ENHANCED DEEP CRAWLER');
  console.log('Features: PDF extraction + External references from trusted sources');
  console.log('='.repeat(70));

  const startTime = Date.now();
  const pages = await crawlSite(START, 50); // Test with 50 pages first
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  
  console.log(`\nCrawl took ${elapsed} minutes`);
  console.log(`Collected ${pages.length} pages with enhanced data`);

  if (pages.length > 0) {
    await saveToFirestore(pages);
    console.log('\n✓ All data saved to Firestore: egymonuments_pages_enhanced');
  } else {
    console.log('\n✗ No pages collected');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
