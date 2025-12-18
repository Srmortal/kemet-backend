#!/usr/bin/env ts-node
/* eslint-disable no-console */
/**
 * Merge all tourism place/activity datasets into a single unified collection.
 * Sources:
 *  - egypt_tourism_places (comprehensive place records)
 *  - tourism_activities_egypt (tours/activities)
 * Target:
 *  - tourism_places_unified (deduped, normalized records)
 */

import 'dotenv/config';
import { firebaseAdmin } from '../src/config/firebase';

type Firestore = FirebaseFirestore.Firestore;

type UnifiedKind = 'place' | 'activity' | 'combined';

type DataSource = {
  collection: string;
  id: string;
};

interface UnifiedPlace {
  id?: string;
  name: string;
  slug: string;
  kind: UnifiedKind;
  type?: string;
  category?: string;
  governorate?: string;
  city?: string;
  location?: string;
  description?: string;
  historicalPeriod?: string;
  significance?: string;
  highlights?: string[];
  activities?: string[];
  visitingHours?: string;
  entryFee?: string;
  bestTimeToVisit?: string;
  coordinates?: { lat: number; lng: number };
  facilities?: string[];
  accessibility?: string;
  website?: string;
  phoneNumber?: string;
  price?: number;
  currency?: string;
  duration?: string;
  rating?: number;
  reviewCount?: number;
  unescoPeriod?: string;
  dataSources: DataSource[];
  sourceUrl?: string;
  scrapedAt: FirebaseFirestore.FieldValue;
}

const SOURCE_COLLECTIONS = {
  places: 'egypt_tourism_places',
  activities: 'tourism_activities_egypt',
  monuments: 'monuments_clean',
};

const TARGET_COLLECTION = 'tourism_places_unified';

const serverTimestamp = firebaseAdmin.firestore.FieldValue.serverTimestamp;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'place';
}

function hashKey(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6);
}

function dedupeArray<T>(input?: T[]): T[] | undefined {
  if (!input || input.length === 0) return undefined;
  return Array.from(new Set(input.filter(Boolean)));
}

function normalizeKey(name: string, location?: string): string {
  const safeName = slugify(name);
  const safeLoc = location ? slugify(location) : '';
  return `${safeName}__${safeLoc}`;
}

function docIdFromKey(name: string, key: string): string {
  const slug = slugify(name);
  const hash = hashKey(key);
  return `${slug}-${hash}`;
}

function mergeField<T>(current: T | undefined, incoming: T | undefined): T | undefined {
  return current !== undefined && current !== null ? current : incoming;
}

function mergeNumericMax(current?: number, incoming?: number): number | undefined {
  if (current === undefined || current === null) return incoming;
  if (incoming === undefined || incoming === null) return current;
  return Math.max(current, incoming);
}

function mergeArrays(current?: string[], incoming?: string[]): string[] | undefined {
  if (!current && !incoming) return undefined;
  return dedupeArray([...(current || []), ...(incoming || [])]);
}

function mergeDataSources(current: DataSource[], incoming: DataSource[]): DataSource[] {
  const key = (ds: DataSource) => `${ds.collection}:${ds.id}`;
  const map = new Map<string, DataSource>();
  [...current, ...incoming].forEach(ds => map.set(key(ds), ds));
  return Array.from(map.values());
}

function mergeEntries(existing: UnifiedPlace, incoming: UnifiedPlace): UnifiedPlace {
  const merged: UnifiedPlace = {
    ...existing,
    kind: existing.kind === incoming.kind ? existing.kind : 'combined',
    type: mergeField(existing.type, incoming.type),
    category: mergeField(existing.category, incoming.category),
    governorate: mergeField(existing.governorate, incoming.governorate),
    city: mergeField(existing.city, incoming.city),
    location: mergeField(existing.location, incoming.location),
    description: mergeField(existing.description, incoming.description),
    historicalPeriod: mergeField(existing.historicalPeriod, incoming.historicalPeriod),
    significance: mergeField(existing.significance, incoming.significance),
    highlights: mergeArrays(existing.highlights, incoming.highlights),
    activities: mergeArrays(existing.activities, incoming.activities),
    visitingHours: mergeField(existing.visitingHours, incoming.visitingHours),
    entryFee: mergeField(existing.entryFee, incoming.entryFee),
    bestTimeToVisit: mergeField(existing.bestTimeToVisit, incoming.bestTimeToVisit),
    coordinates: mergeField(existing.coordinates, incoming.coordinates),
    facilities: mergeArrays(existing.facilities, incoming.facilities),
    accessibility: mergeField(existing.accessibility, incoming.accessibility),
    website: mergeField(existing.website, incoming.website),
    phoneNumber: mergeField(existing.phoneNumber, incoming.phoneNumber),
    price: mergeField(existing.price, incoming.price),
    currency: mergeField(existing.currency, incoming.currency),
    duration: mergeField(existing.duration, incoming.duration),
    rating: mergeNumericMax(existing.rating, incoming.rating),
    reviewCount: mergeNumericMax(existing.reviewCount, incoming.reviewCount),
    unescoPeriod: mergeField(existing.unescoPeriod, incoming.unescoPeriod),
    dataSources: mergeDataSources(existing.dataSources, incoming.dataSources),
    sourceUrl: mergeField(existing.sourceUrl, incoming.sourceUrl),
    scrapedAt: serverTimestamp(),
  };

  return merged;
}

function cleanUndefined(obj: UnifiedPlace): UnifiedPlace {
  const entries = Object.entries(obj).filter(([, value]) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
  return Object.fromEntries(entries) as UnifiedPlace;
}

function mapPlaceDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): UnifiedPlace {
  const data = doc.data();

  return {
    name: data.name || data.title || 'Unknown Place',
    slug: slugify(data.name || data.title || doc.id),
    kind: 'place',
    type: data.type,
    category: data.category,
    governorate: data.governorate,
    city: data.city,
    location: data.city || data.governorate,
    description: data.description,
    historicalPeriod: data.historicalPeriod,
    significance: data.significance || data.unescoSite,
    highlights: dedupeArray([...(data.nearbyPlaces || []), ...(data.highlights || [])]),
    activities: dedupeArray(data.activities),
    visitingHours: data.visitingHours,
    entryFee: data.entryFee,
    bestTimeToVisit: data.bestTimeToVisit,
    coordinates: data.coordinates,
    facilities: dedupeArray(data.facilities),
    accessibility: data.accessibility,
    website: data.website,
    phoneNumber: data.phoneNumber,
    rating: data.rating,
    reviewCount: data.reviewCount,
    unescoPeriod: data.unescoPeriod,
    dataSources: [{ collection: SOURCE_COLLECTIONS.places, id: doc.id }],
    sourceUrl: data.source,
    scrapedAt: serverTimestamp(),
  };
}

function mapActivityDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): UnifiedPlace {
  const data = doc.data();

  return {
    name: data.title || 'Unnamed Activity',
    slug: slugify(data.title || doc.id),
    kind: 'activity',
    category: data.category,
    city: data.location,
    location: data.location,
    description: data.description,
    highlights: dedupeArray(data.highlights),
    activities: dedupeArray(data.highlights),
    price: data.price,
    currency: data.currency,
    duration: data.duration,
    rating: data.rating,
    reviewCount: data.reviewCount,
    website: data.url,
    sourceUrl: data.sourceUrl,
    dataSources: [{ collection: SOURCE_COLLECTIONS.activities, id: doc.id }],
    scrapedAt: serverTimestamp(),
  };
}

function mapMonumentDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): UnifiedPlace {
  const data = doc.data();
  const name = data.title || data.h1 || 'Untitled Monument';

  return {
    name,
    slug: slugify(name || doc.id),
    kind: 'place',
    category: (data.categories && data.categories[0]) || 'Monument',
    description: data.description,
    highlights: dedupeArray([...(data.categories || []), ...(data.tags || [])]),
    activities: dedupeArray(data.tags),
    website: data.url,
    sourceUrl: data.url,
    dataSources: [{ collection: SOURCE_COLLECTIONS.monuments, id: doc.id }],
    scrapedAt: serverTimestamp(),
  };
}

async function fetchAll(db: Firestore, collection: string): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const snap = await db.collection(collection).get();
  return snap.docs;
}

async function writeBatched(db: Firestore, entries: UnifiedPlace[]): Promise<void> {
  const col = db.collection(TARGET_COLLECTION);
  let batch = db.batch();
  let opCount = 0;
  let batchIndex = 1;

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const key = normalizeKey(entry.name, entry.location || entry.city || entry.governorate);
    const docId = docIdFromKey(entry.name, key);

    const payload = cleanUndefined({ ...entry, id: docId });

    batch.set(col.doc(docId), payload);
    opCount += 1;

    if (opCount === 450 || i === entries.length - 1) {
      console.log(`📝 Committing batch ${batchIndex} (${opCount} records)...`);
      await batch.commit();
      batch = db.batch();
      opCount = 0;
      batchIndex += 1;
    }
  }
}

async function run(): Promise<void> {
  console.log('🚀 Merging tourism datasets...');
  console.log(`📁 Sources: ${SOURCE_COLLECTIONS.places}, ${SOURCE_COLLECTIONS.activities}`);
  console.log(`📁 Target: ${TARGET_COLLECTION}`);

  const db = firebaseAdmin.firestore();

  const [placeDocs, activityDocs, monumentDocs] = await Promise.all([
    fetchAll(db, SOURCE_COLLECTIONS.places),
    fetchAll(db, SOURCE_COLLECTIONS.activities),
    fetchAll(db, SOURCE_COLLECTIONS.monuments),
  ]);

  console.log(`📥 Loaded ${placeDocs.length} place records`);
  console.log(`📥 Loaded ${activityDocs.length} activity records`);
  console.log(`📥 Loaded ${monumentDocs.length} monument records`);

  const merged = new Map<string, UnifiedPlace>();

  const addEntry = (entry: UnifiedPlace) => {
    const key = normalizeKey(entry.name, entry.location || entry.city || entry.governorate);
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, mergeEntries(existing, entry));
    } else {
      merged.set(key, entry);
    }
  };

  placeDocs.forEach(doc => addEntry(mapPlaceDoc(doc)));
  activityDocs.forEach(doc => addEntry(mapActivityDoc(doc)));
  monumentDocs.forEach(doc => addEntry(mapMonumentDoc(doc)));

  const mergedEntries = Array.from(merged.values());
  const placeCount = mergedEntries.filter(e => e.kind === 'place').length;
  const activityCount = mergedEntries.filter(e => e.kind === 'activity').length;
  const combinedCount = mergedEntries.filter(e => e.kind === 'combined').length;

  console.log('📊 Merge summary:');
  console.log(`   • Total unique entries: ${mergedEntries.length}`);
  console.log(`   • Places only: ${placeCount}`);
  console.log(`   • Activities only: ${activityCount}`);
  console.log(`   • Combined (place + activity merged): ${combinedCount}`);

  await writeBatched(db, mergedEntries);

  console.log('✅ Merge complete');
  console.log(`📁 Unified collection: ${TARGET_COLLECTION}`);
}

run().catch(err => {
  console.error('❌ Merge failed:', err);
  process.exit(1);
});
