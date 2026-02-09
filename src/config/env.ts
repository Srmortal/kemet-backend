import { config as dotenvConfig } from 'dotenv';
import path from 'path';

// Load .env from project root for both src and dist runtimes.
dotenvConfig({ path: path.resolve(process.cwd(), '.env') });
dotenvConfig({ path: path.resolve(__dirname, '../../.env') });
