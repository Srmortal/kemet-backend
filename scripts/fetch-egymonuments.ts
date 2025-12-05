import 'dotenv/config';
import axios from 'axios';
import https from 'https';
import * as cheerio from 'cheerio';
import { firebaseAdmin } from '../src/config/firebase';

/**
 * Scrapes basic monument data from egymonuments.com and writes to Firestore.
 * Note: This is a best-effort scraper; adapt selectors based on the site's structure.
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
  imageStoragePath?: string; // Local Firebase Storage path
  allImages: string[]; // All images found on page
  text?: string;
  html?: string; // Full HTML content
  headings: { level: number; text: string }[]; // h1-h6 structure
  lists: string[]; // ul/ol items
  tables: string[]; // table data
  categories?: string[];
  tags?: string[];
  links: string[];
  statusCode?: number;
};

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
    validateStatus: (status) => status < 500, // Accept redirects and client errors
  });
  return { html: res.data as string, statusCode: res.status };
}

function absoluteUrl(base: string, href?: string): string | undefined {
  if (!href) return undefined;
  if (href.startsWith('http')) return href;
  if (href.startsWith('//')) return `https:${href}`;
  return new URL(href, base).toString();
}

async function downloadAndStoreImage(imageUrl: string, pageUrl: string): Promise<string | undefined> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const extension = contentType.split('/')[1] || 'jpg';
    const hash = Buffer.from(imageUrl).toString('base64url').slice(0, 32);
    const filename = `egymonuments/images/${hash}.${extension}`;
    
    const bucket = firebaseAdmin.storage().bucket();
    const file = bucket.file(filename);
    
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

  // Collect internal links
  const links: string[] = [];
  $('a').each((_i, el) => {
    const href = $(el).attr('href');
    const abs = absoluteUrl(url, href);
    if (!abs) return;
    if (new URL(abs).hostname === new URL(url).hostname) {
      links.push(abs.split('#')[0].split('?')[0]);
    }
  });

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

  console.log(`Starting deep crawl from ${startUrl}`);
  console.log(`Max pages: ${maxPages || 'unlimited'}`);

  while (queue.length && (!maxPages || results.length < maxPages)) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const doc = await parsePage(url);
      results.push(doc);

      // Progress logging
      if (results.length % 10 === 0) {
        console.log(`Crawled: ${results.length} | Queue: ${queue.length} | Failed: ${failed.length}`);
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
      // Politeness delay - slightly reduced for faster crawling
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      failed.push(url);
      console.warn(`[${results.length}] Failed: ${url} - ${(e as Error).message}`);
    }
  }
  
  console.log(`\nCrawl complete:`);
  console.log(`  Success: ${results.length} pages`);
  console.log(`  Failed: ${failed.length} pages`);
  console.log(`  Remaining queue: ${queue.length}`);
  
  return results;
}

async function saveToFirestore(items: PageDoc[]) {
  const db = firebaseAdmin.firestore();
  const col = db.collection('egymonuments_pages');
  
  console.log(`Saving ${items.length} pages to Firestore...`);
  
  // Firestore batch limit is 500 operations
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
        statusCode: m.statusCode || null,
        source: 'egymonuments.com',
        fetchedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    
    await batch.commit();
    console.log(`  Saved batch ${Math.floor(i / batchSize) + 1} (${chunk.length} items)`);
  }
}

async function main() {
  const START = 'https://egymonuments.com/';
  console.log('='.repeat(60));
  console.log('EGYMONUMENTS.COM DEEP CRAWLER');
  console.log('='.repeat(60));

  const startTime = Date.now();
  const pages = await crawlSite(START); // No limit - crawl everything
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  
  console.log(`\nCrawl took ${elapsed} minutes`);
  console.log(`Collected ${pages.length} pages with full metadata`);

  if (pages.length > 0) {
    await saveToFirestore(pages);
    console.log('\n✓ All data saved to Firestore: egymonuments_pages');
  } else {
    console.log('\n✗ No pages collected');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
