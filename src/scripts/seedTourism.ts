import * as dotenv from 'dotenv';
dotenv.config();

import { firebaseAdmin } from '../config/firebase';
import { Timestamp, GeoPoint } from 'firebase-admin/firestore';
import * as fs from 'node:fs';
import * as path from 'path';
import logger from '@utils/logger';

interface Location {
  lat: number;
  lng: number;
}

interface Site {
  title: string;
  description: string;
  location: Location;
  era?: string;
  district?: string;
}

interface TourismSiteDocument {
  title: string;
  description: string;
  location: GeoPoint;
  governorate: string;
  category: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  era?: string;
  district?: string;
}

const loadMonuments = (): Record<string, Site[]> => {
  const monuments: Record<string, Site[]> = {};
  const dataDir = path.join(__dirname, '../data/tourism');
  
  if (!fs.existsSync(dataDir)) {
      logger.warn("Data directory not found:", dataDir);
      return {};
  }

  const files = fs.readdirSync(dataDir);
  
  files.forEach(file => {
    if (path.extname(file) === '.json') {
      try {
        const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8');
        const data: Site[] = JSON.parse(raw);
        
        // Convert filename 'kafr_el_sheikh.json' -> 'Kafr El Sheikh'
        const governorateName = path.basename(file, '.json')
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        monuments[governorateName] = data;
      } catch (error) {
        logger.error(`Error loading file ${file}:`, error);
      }
    }
  });
  
  return monuments;
}


async function seedTourismData() {
  const db = firebaseAdmin.firestore();
  
  const monuments = loadMonuments();
  
  // Use FieldValue for timestamps in admin SDK
  const timestamp = Timestamp.now();

  const collectionRef = db.collection('tourism_sites');
  
  // Firestore batch limit is 500. We will split if necessary.
  const MAX_BATCH_SIZE = 500;
  let batch = db.batch();
  let count = 0;
  let totalCount = 0;

  for (const [governorate, sites] of Object.entries(monuments)) {
    for (const site of sites) {
      const docRef = collectionRef.doc();
      const docData: TourismSiteDocument = {
        title: site.title,
        description: site.description,
        location: new GeoPoint(site.location.lat, site.location.lng),
        governorate: governorate, // Storing governorate for filtering
        category: 'Historical', // Setting a default category
        createdAt: timestamp,
        updatedAt: timestamp
      };

      if (site.era) docData.era = site.era;
      if (site.district) docData.district = site.district;

      batch.set(docRef, docData);
      
      count++;
      totalCount++;

      if (count >= MAX_BATCH_SIZE) {
        await batch.commit();
        logger.info(`Committed batch of ${count} sites.`);
        batch = db.batch();
        count = 0;
      }
    }
  }

  try {
    if (count > 0) {
      await batch.commit();
      logger.info(`Committed final batch of ${count} sites.`);
    }
    logger.info(`Tourism data seeded successfully! Total added: ${totalCount} sites.`);
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedTourismData();
