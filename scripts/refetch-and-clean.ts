import 'dotenv/config';
import axios from 'axios';
import https from 'https';
import * as cheerio from 'cheerio';
import { firebaseAdmin } from '../src/config/firebase';

/**
 * Re-fetches pages with missing/insufficient data and updates monuments_clean collection
 * Identifies pages that need more data and re-scrapes them with enhanced extraction
 */

type CleanMonumentDoc = {
  url: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  excerpt: string;
  image?: string;
  imageStoragePath?: string;
  metadata: {
    author?: string;
    publishDate?: string;
    keywords: string[];
    h1?: string;
  };
  structure: {
    headings: { level: number; text: string; id: string }[];
    hasTables: boolean;
    hasLists: boolean;
  };
  categories: string[];
  tags: string[];
  relatedPages: string[];
  searchText: string;
  status: 'published' | 'draft';
  importedAt: FirebaseFirestore.Timestamp;
  lastUpdated: FirebaseFirestore.Timestamp;
};

type EnhancedPageData = {
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
  categories: string[];
  tags: string[];
  links: string[];
  pdfContent?: string[];
  externalReferences?: Array<{
    url: string;
    title?: string;
    description?: string;
    text?: string;
    type: 'webpage' | 'pdf' | 'unknown';
  }>;
  statusCode?: number;
};

// Helper functions
function cleanText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim();
}

function generateSlug(title: string, url: string): string {
  const urlParts = url.split('/').filter(Boolean);
  const lastPart = urlParts[urlParts.length - 1];
  
  if (lastPart && lastPart !== 'egymonuments.com') {
    return lastPart
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function extractKeywords(text: string): string[] {
  const keywords = new Set<string>();
  const commonWords = [
    'temple', 'tomb', 'pyramid', 'pharaoh', 'egypt', 'ancient', 'dynasty', 
    'statue', 'relief', 'hieroglyph', 'sphinx', 'obelisk', 'sanctuary', 
    'king', 'queen', 'god', 'goddess', 'valley', 'nile', 'cairo', 'luxor',
    'giza', 'karnak', 'thebes', 'memphis', 'alexandria', 'ramses', 'tutankhamun',
    'cleopatra', 'ptolemy', 'hieratic', 'demotic', 'coptic', 'nubia'
  ];
  
  const lowerText = text.toLowerCase();
  commonWords.forEach(word => {
    if (lowerText.includes(word)) {
      keywords.add(word);
    }
  });
  
  return Array.from(keywords);
}

function generateExcerpt(text: string, maxLength = 200): string {
  const cleaned = cleanText(text);
  if (cleaned.length <= maxLength) return cleaned;
  
  const truncated = cleaned.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastPeriod > maxLength * 0.7) {
    return truncated.slice(0, lastPeriod + 1);
  }
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }
  return truncated + '...';
}

function addHeadingIds(headings: { level: number; text: string }[]): { level: number; text: string; id: string }[] {
  return headings.map((h, idx) => ({
    ...h,
    id: `heading-${idx}-${h.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`,
  }));
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

// Removed trusted domain constants for this script (not used)


// Removed PDF extraction helper (not used in this script)

// Removed unused ExternalRef type

// Removed external reference fetching in this script to reduce unused code warnings

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
    
    // Check if file already exists
    const [exists] = await file.exists();
    if (exists) {
      return filename;
    }
    
    await file.save(Buffer.from(response.data), {
      metadata: { contentType, metadata: { sourceUrl: imageUrl, pageUrl } },
    });
    
    return filename;
  } catch (e) {
    console.warn(`Failed to store image: ${imageUrl}`);
    return undefined;
  }
}

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

async function enhancedParsePage(url: string): Promise<EnhancedPageData> {
  const { html, statusCode } = await fetchPage(url);
  const $ = cheerio.load(html);

  // Enhanced metadata extraction
  const title = 
    $('meta[property="og:title"]').attr('content') || 
    $('meta[name="twitter:title"]').attr('content') ||
    $('h1.entry-title, h1.post-title, h1.article-title').first().text().trim() ||
    $('title').text().trim();
  
  const h1 = $('h1').first().text().trim();
  
  const description = 
    $('meta[name="description"]').attr('content') || 
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    $('.entry-content p, .post-content p, article p').first().text().trim() ||
    $('p').first().text().trim();
  
  const keywords = 
    $('meta[name="keywords"]').attr('content') ||
    $('meta[property="article:tag"]').attr('content');
  
  const author = 
    $('meta[name="author"]').attr('content') || 
    $('meta[property="article:author"]').attr('content') ||
    $('.author-name, .by-author, [rel="author"]').first().text().trim();
  
  const publishDate = 
    $('meta[property="article:published_time"]').attr('content') || 
    $('meta[property="article:modified_time"]').attr('content') ||
    $('time[datetime]').attr('datetime') ||
    $('.published, .post-date, .entry-date').first().attr('datetime');
  
  // Enhanced category extraction
  const categories: string[] = [];
  $('a[rel="category tag"], a[rel="category"], .category a, .categories a, .post-category a, [class*="category"] a').each((_i, el) => {
    const cat = $(el).text().trim();
    if (cat && cat.length > 2 && cat.length < 50) categories.push(cat);
  });
  
  // Enhanced tag extraction
  const tags: string[] = [];
  $('a[rel="tag"], .tag a, .tags a, .post-tag a, [class*="tag"] a').each((_i, el) => {
    const tag = $(el).text().trim();
    if (tag && tag.length > 2 && tag.length < 30) tags.push(tag);
  });
  
  // Enhanced image extraction
  const ogImage = $('meta[property="og:image"]').attr('content');
  const twitterImage = $('meta[name="twitter:image"]').attr('content');
  const articleImage = $('article img, .entry-content img, .post-content img').first().attr('src');
  const heroImg = $('.hero-image img, .featured-image img, .post-thumbnail img').first().attr('src');
  const image = absoluteUrl(url, ogImage || twitterImage || heroImg || articleImage);
  
  // Collect all images with better filtering
  const allImages: string[] = [];
  $('article img, .entry-content img, .post-content img, .content img').each((_i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
    const abs = absoluteUrl(url, src);
    if (abs && !abs.includes('icon') && !abs.includes('logo') && !abs.includes('avatar')) {
      allImages.push(abs);
    }
  });
  
  // Download and store primary image
  let imageStoragePath: string | undefined;
  if (image) {
    imageStoragePath = await downloadAndStoreImage(image, url);
  }
  
  // Enhanced heading extraction
  const headings: { level: number; text: string }[] = [];
  $('article h1, article h2, article h3, article h4, article h5, article h6, .entry-content h1, .entry-content h2, .entry-content h3, .entry-content h4, .entry-content h5, .entry-content h6').each((_i, el) => {
    const level = parseInt(el.tagName[1]);
    const text = $(el).text().trim();
    if (text && text.length > 1) headings.push({ level, text });
  });
  
  // Enhanced list extraction
  const lists: string[] = [];
  $('article ul, article ol, .entry-content ul, .entry-content ol').each((_i, el) => {
    const items: string[] = [];
    $(el).find('li').each((_j, li) => {
      const item = $(li).clone().children('ul, ol').remove().end().text().trim();
      if (item && item.length > 1) items.push(item);
    });
    if (items.length) lists.push(items.join(' | '));
  });
  
  // Enhanced table extraction
  const tables: string[] = [];
  $('article table, .entry-content table').each((_i, el) => {
    const rows: string[] = [];
    $(el).find('tr').each((_j, tr) => {
      const cells: string[] = [];
      $(tr).find('td, th').each((_k, cell) => {
        const cellText = $(cell).text().trim();
        if (cellText) cells.push(cellText);
      });
      if (cells.length) rows.push(cells.join(' | '));
    });
    if (rows.length) tables.push(rows.join('\n'));
  });

  // Enhanced link collection
  const links: string[] = [];
  $('article a, .entry-content a, .post-content a').each((_i, el) => {
    const href = $(el).attr('href');
    const abs = absoluteUrl(url, href);
    if (!abs) return;
    try {
      const linkUrl = new URL(abs);
      const baseUrl = new URL(url);
      if (linkUrl.hostname === baseUrl.hostname) {
        const cleanUrl = abs.split('#')[0].split('?')[0];
        if (cleanUrl !== url) links.push(cleanUrl);
      }
    } catch {
      // Ignore invalid URLs
    }
  });

  // Enhanced text extraction with multiple fallbacks
  const textParts: string[] = [];
  const contentSelectors = [
    'article .entry-content',
    'article .post-content',
    '.entry-content',
    '.post-content',
    'article',
    'main',
    '.content',
    '.article-body',
    '.post-body'
  ];
  
  for (const selector of contentSelectors) {
    const content = $(selector).first();
    if (content.length) {
      // Remove unwanted elements
      content.find('script, style, noscript, .sidebar, .related, .comments, nav, footer, header').remove();
      const txt = content.text().trim();
      if (txt && txt.length > 100) {
        textParts.push(txt);
        break;
      }
    }
  }
  
  // Fallback to all paragraphs if no content found
  if (!textParts.length) {
    $('p').each((_i, el) => {
      const txt = $(el).text().trim();
      if (txt && txt.length > 50) textParts.push(txt);
    });
  }
  
  const text = textParts.join('\n\n').slice(0, 50000);
  
  // Enhanced HTML extraction
  $('script, style, noscript, nav, footer, header, .sidebar, .comments, .related-posts').remove();
  const contentHtml = 
    $('article .entry-content, article .post-content').html() ||
    $('.entry-content, .post-content').html() ||
    $('article').html() ||
    $('main').html() ||
    '';

  return { 
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

function needsEnhancement(doc: CleanMonumentDoc): { needs: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // Check for missing or insufficient data
  if (!doc.title || doc.title.length < 5 || doc.title === 'Untitled Monument') {
    reasons.push('insufficient title');
  }
  
  if (!doc.description || doc.description.length < 50) {
    reasons.push('insufficient description');
  }
  
  if (!doc.content || doc.content.length < 200) {
    reasons.push('insufficient content');
  }
  
  if (doc.metadata.keywords.length === 0) {
    reasons.push('no keywords');
  }
  
  if (!doc.image && !doc.imageStoragePath) {
    reasons.push('no image');
  }
  
  if (doc.categories.length === 0 || (doc.categories.length === 1 && doc.categories[0] === 'General')) {
    reasons.push('generic categories');
  }
  
  if (doc.structure.headings.length === 0) {
    reasons.push('no heading structure');
  }
  
  if (doc.status === 'draft') {
    reasons.push('draft status');
  }
  
  return { needs: reasons.length > 0, reasons };
}

function mergeEnhancedData(existing: CleanMonumentDoc, enhanced: EnhancedPageData): CleanMonumentDoc {
  const title = enhanced.title && enhanced.title.length > 5 ? cleanText(enhanced.title) : existing.title;
  const slug = generateSlug(title, existing.url);
  const content = enhanced.text && enhanced.text.length > existing.content.length 
    ? cleanText(enhanced.text) 
    : existing.content;
  const description = enhanced.description && enhanced.description.length > existing.description.length
    ? cleanText(enhanced.description)
    : existing.description || generateExcerpt(content, 160);
  const excerpt = generateExcerpt(content, 200);
  
  // Merge keywords
  const existingKeywords = existing.metadata.keywords;
  const newKeywords = enhanced.keywords 
    ? enhanced.keywords.split(',').map(k => cleanText(k)).filter(Boolean)
    : extractKeywords(content);
  const mergedKeywords = Array.from(new Set([...existingKeywords, ...newKeywords])).slice(0, 20);
  
  // Merge categories
  const existingCategories = existing.categories.filter(c => c !== 'General');
  const newCategories = enhanced.categories
    .map(c => cleanText(c))
    .filter(c => c && c.length > 2 && c.length < 50)
    .map(c => c.charAt(0).toUpperCase() + c.slice(1));
  const mergedCategories = Array.from(new Set([...existingCategories, ...newCategories])).slice(0, 5);
  
  // Merge tags
  const existingTags = existing.tags;
  const newTags = enhanced.tags
    .map(t => cleanText(t))
    .filter(t => t && t.length > 2 && t.length < 30)
    .map(t => t.toLowerCase());
  const mergedTags = Array.from(new Set([...existingTags, ...newTags])).slice(0, 15);
  
  // Merge related pages
  const mergedRelated = Array.from(new Set([...existing.relatedPages, ...enhanced.links])).slice(0, 30);
  
  // Build enhanced search text
  const searchText = [
    title,
    description,
    content,
    ...mergedKeywords,
    ...mergedCategories,
    ...mergedTags,
  ].join(' ').toLowerCase();
  
  // Build metadata
  const metadata: CleanMonumentDoc['metadata'] = {
    keywords: mergedKeywords,
  };
  
  if (enhanced.author || existing.metadata.author) {
    metadata.author = enhanced.author ? cleanText(enhanced.author) : existing.metadata.author;
  }
  if (enhanced.publishDate || existing.metadata.publishDate) {
    metadata.publishDate = enhanced.publishDate || existing.metadata.publishDate;
  }
  if (enhanced.h1 || existing.metadata.h1) {
    metadata.h1 = enhanced.h1 ? cleanText(enhanced.h1) : existing.metadata.h1;
  }
  
  const result: CleanMonumentDoc = {
    url: existing.url,
    slug,
    title,
    description,
    content,
    excerpt,
    metadata,
    structure: {
      headings: enhanced.headings.length > existing.structure.headings.length
        ? addHeadingIds(enhanced.headings)
        : existing.structure.headings,
      hasTables: enhanced.tables.length > 0 || existing.structure.hasTables,
      hasLists: enhanced.lists.length > 0 || existing.structure.hasLists,
    },
    categories: mergedCategories.length > 0 ? mergedCategories : ['General'],
    tags: mergedTags,
    relatedPages: mergedRelated,
    searchText,
    status: (title.length > 5 && (content.length > 200 || description.length > 50)) ? 'published' : 'draft',
    importedAt: existing.importedAt,
    lastUpdated: firebaseAdmin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
  };
  
  // Use new image if available, otherwise keep existing
  if (enhanced.imageStoragePath) {
    result.imageStoragePath = enhanced.imageStoragePath;
    result.image = enhanced.image;
  } else if (existing.imageStoragePath) {
    result.imageStoragePath = existing.imageStoragePath;
    result.image = existing.image;
  }
  
  return result;
}

async function refetchAndEnhance(doc: CleanMonumentDoc): Promise<CleanMonumentDoc> {
  try {
    const enhanced = await enhancedParsePage(doc.url);
    return mergeEnhancedData(doc, enhanced);
  } catch (error) {
    console.warn(`Failed to refetch ${doc.url}: ${(error as Error).message}`);
    return doc;
  }
}

async function main() {
  const db = firebaseAdmin.firestore();
  const collection = db.collection('monuments_clean');

  console.log('='.repeat(60));
  console.log('MONUMENTS DATA ENHANCEMENT');
  console.log('='.repeat(60));
  console.log('Analyzing monuments_clean collection for missing data...\n');

  const startTime = Date.now();

  // Fetch all documents and identify those needing enhancement
  const snapshot = await collection.get();
  const docsNeedingEnhancement: { doc: CleanMonumentDoc; id: string; reasons: string[] }[] = [];

  console.log(`Total documents: ${snapshot.size}`);
  console.log('Scanning for documents with missing or insufficient data...\n');

  snapshot.forEach((doc) => {
    const data = doc.data() as CleanMonumentDoc;
    const { needs, reasons } = needsEnhancement(data);
    if (needs) {
      docsNeedingEnhancement.push({ doc: data, id: doc.id, reasons });
    }
  });

  console.log(`Found ${docsNeedingEnhancement.length} documents needing enhancement\n`);

  if (docsNeedingEnhancement.length === 0) {
    console.log('✓ All documents have sufficient data!');
    return;
  }

  // Show sample of issues
  console.log('Sample issues found:');
  docsNeedingEnhancement.slice(0, 5).forEach(({ doc, reasons }) => {
    console.log(`  • ${doc.title}: ${reasons.join(', ')}`);
  });
  console.log();

  // Process enhancements with rate limiting
  let enhanced = 0;
  let failed = 0;
  const batchSize = 10;

  console.log('Starting re-fetch and enhancement process...\n');

  for (let i = 0; i < docsNeedingEnhancement.length; i += batchSize) {
    const batch = docsNeedingEnhancement.slice(i, i + batchSize);
    
    const results = await Promise.allSettled(
      batch.map(({ doc, id }) => 
        refetchAndEnhance(doc).then(updated => ({ updated, id }))
      )
    );

    // Update Firestore
    const writeBatch = db.batch();
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { updated, id } = result.value;
        writeBatch.set(collection.doc(id), updated, { merge: true });
        enhanced++;
      } else {
        failed++;
      }
    }

    await writeBatch.commit();
    
    console.log(`Progress: ${enhanced + failed}/${docsNeedingEnhancement.length} (${enhanced} enhanced, ${failed} failed)`);
    
    // Politeness delay between batches
    if (i + batchSize < docsNeedingEnhancement.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('ENHANCEMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Time elapsed: ${elapsed} minutes`);
  console.log(`Documents enhanced: ${enhanced}`);
  console.log(`Documents failed: ${failed}`);
  console.log(`Success rate: ${((enhanced / (enhanced + failed)) * 100).toFixed(1)}%`);

  // Generate updated stats
  const [totalSnapshot, publishedSnapshot, draftSnapshot] = await Promise.all([
    collection.count().get(),
    collection.where('status', '==', 'published').count().get(),
    collection.where('status', '==', 'draft').count().get(),
  ]);

  console.log('\nUpdated Stats:');
  console.log(`  Total: ${totalSnapshot.data().count}`);
  console.log(`  Published: ${publishedSnapshot.data().count}`);
  console.log(`  Draft: ${draftSnapshot.data().count}`);

  console.log('\n✓ Enhancement completed successfully');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
