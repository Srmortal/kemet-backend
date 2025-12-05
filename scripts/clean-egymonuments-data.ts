import 'dotenv/config';
import { firebaseAdmin } from '../src/config/firebase';

/**
 * Cleans and transforms data from egymonuments_pages collection
 * Creates a new clean collection: monuments_clean
 */

type RawPageDoc = {
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
  statusCode?: number;
  source: string;
  fetchedAt: FirebaseFirestore.Timestamp;
};

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

function cleanText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim();
}

function generateSlug(title: string, url: string): string {
  // Try to extract meaningful slug from URL or title
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
  
  // Common Egyptian monument keywords
  const commonWords = ['temple', 'tomb', 'pyramid', 'pharaoh', 'egypt', 'ancient', 'dynasty', 'statue', 'relief', 'hieroglyph', 'sphinx', 'obelisk', 'sanctuary', 'king', 'queen', 'god', 'goddess'];
  
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
  
  // Try to break at sentence end
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

function cleanCategories(categories?: string[]): string[] {
  if (!categories || categories.length === 0) return ['General'];
  
  return Array.from(new Set(
    categories
      .map(c => cleanText(c))
      .filter(c => c && c.length > 2 && c.length < 50)
      .map(c => c.charAt(0).toUpperCase() + c.slice(1))
  )).slice(0, 5);
}

function cleanTags(tags?: string[]): string[] {
  if (!tags) return [];
  
  return Array.from(new Set(
    tags
      .map(t => cleanText(t))
      .filter(t => t && t.length > 2 && t.length < 30)
      .map(t => t.toLowerCase())
  )).slice(0, 10);
}

function cleanRelatedPages(links: string[], baseUrl: string): string[] {
  if (!links) return [];
  
  return Array.from(new Set(
    links
      .filter(link => link.startsWith(baseUrl) && link !== baseUrl)
      .slice(0, 20)
  ));
}

function determineStatus(doc: RawPageDoc): 'published' | 'draft' {
  // Consider it published if it has meaningful content
  const hasTitle = doc.title && doc.title.length > 3;
  const hasContent = doc.text && doc.text.length > 100;
  const hasDescription = doc.description && doc.description.length > 20;
  
  return (hasTitle && (hasContent || hasDescription)) ? 'published' : 'draft';
}

function transformToClean(raw: RawPageDoc): CleanMonumentDoc {
  const title = cleanText(raw.title || raw.h1 || 'Untitled Monument');
  const slug = generateSlug(title, raw.url);
  const content = cleanText(raw.text || '');
  const description = cleanText(raw.description || generateExcerpt(content, 160));
  const excerpt = generateExcerpt(content, 200);
  
  // Build search text for full-text search
  const searchText = [
    title,
    description,
    content,
    raw.keywords,
    ...(raw.categories || []),
    ...(raw.tags || []),
  ].filter(Boolean).join(' ').toLowerCase();
  
  const metadata: CleanMonumentDoc['metadata'] = {
    keywords: raw.keywords 
      ? raw.keywords.split(',').map(k => cleanText(k)).filter(Boolean)
      : extractKeywords(content),
  };
  
  // Only add optional fields if they have values
  if (raw.author) {
    metadata.author = cleanText(raw.author);
  }
  if (raw.publishDate) {
    metadata.publishDate = raw.publishDate;
  }
  if (raw.h1) {
    metadata.h1 = cleanText(raw.h1);
  }
  
  const result: CleanMonumentDoc = {
    url: raw.url,
    slug,
    title,
    description,
    content,
    excerpt,
    metadata,
    structure: {
      headings: addHeadingIds(raw.headings || []),
      hasTables: (raw.tables || []).length > 0,
      hasLists: (raw.lists || []).length > 0,
    },
    categories: cleanCategories(raw.categories),
    tags: cleanTags(raw.tags),
    relatedPages: cleanRelatedPages(raw.links || [], 'https://egymonuments.com'),
    searchText,
    status: determineStatus(raw),
    importedAt: raw.fetchedAt,
    lastUpdated: firebaseAdmin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
  };
  
  // Add optional image fields only if they exist
  if (raw.image) {
    result.image = raw.image;
  }
  if (raw.imageStoragePath) {
    result.imageStoragePath = raw.imageStoragePath;
  }
  
  return result;
}

async function processInBatches(
  sourceCollection: FirebaseFirestore.CollectionReference,
  targetCollection: FirebaseFirestore.CollectionReference,
  batchSize = 100
) {
  let processed = 0;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  let hasMore = true;

  console.log('Starting data cleaning and transformation...\n');

  while (hasMore) {
    let query = sourceCollection.orderBy('fetchedAt').limit(batchSize);
    
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    
    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    // Transform documents
    const batch = firebaseAdmin.firestore().batch();
    const docs = snapshot.docs;
    
    for (const doc of docs) {
      const rawData = doc.data() as RawPageDoc;
      const cleanData = transformToClean(rawData);
      
      // Use same document ID for easy cross-reference
      const targetRef = targetCollection.doc(doc.id);
      batch.set(targetRef, cleanData);
    }

    await batch.commit();
    
    processed += docs.length;
    lastDoc = docs[docs.length - 1];
    
    console.log(`Processed: ${processed} documents`);
    
    if (docs.length < batchSize) {
      hasMore = false;
    }
  }

  return processed;
}

async function createIndexes() {
  console.log('\nNote: Create these Firestore indexes manually in Firebase Console:');
  console.log('1. Collection: monuments_clean, Fields: status (ASC), lastUpdated (DESC)');
  console.log('2. Collection: monuments_clean, Fields: categories (ARRAY), lastUpdated (DESC)');
  console.log('3. Collection: monuments_clean, Fields: tags (ARRAY), lastUpdated (DESC)');
  console.log('4. Collection: monuments_clean, Fields: status (ASC), categories (ARRAY), lastUpdated (DESC)');
}

async function generateStats(collection: FirebaseFirestore.CollectionReference) {
  const [totalSnapshot, publishedSnapshot, draftSnapshot] = await Promise.all([
    collection.count().get(),
    collection.where('status', '==', 'published').count().get(),
    collection.where('status', '==', 'draft').count().get(),
  ]);

  return {
    total: totalSnapshot.data().count,
    published: publishedSnapshot.data().count,
    draft: draftSnapshot.data().count,
  };
}

async function main() {
  const db = firebaseAdmin.firestore();
  const sourceCol = db.collection('egymonuments_pages');
  const targetCol = db.collection('monuments_clean');

  console.log('='.repeat(60));
  console.log('EGYMONUMENTS DATA CLEANING & TRANSFORMATION');
  console.log('='.repeat(60));
  console.log(`Source: egymonuments_pages`);
  console.log(`Target: monuments_clean`);
  console.log('='.repeat(60));

  const startTime = Date.now();

  // Process all documents
  const processedCount = await processInBatches(sourceCol, targetCol);

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('CLEANING COMPLETE');
  console.log('='.repeat(60));
  console.log(`Time elapsed: ${elapsed} minutes`);
  console.log(`Documents processed: ${processedCount}`);

  // Generate stats
  const stats = await generateStats(targetCol);
  console.log('\nStats:');
  console.log(`  Total: ${stats.total}`);
  console.log(`  Published: ${stats.published}`);
  console.log(`  Draft: ${stats.draft}`);

  // Print index suggestions
  await createIndexes();

  console.log('\n✓ Data cleaning completed successfully');
  console.log(`\nNew clean collection: monuments_clean`);
  console.log('Original collection (egymonuments_pages) preserved for reference');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
