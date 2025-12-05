import 'dotenv/config';
import axios from 'axios';
import https from 'https';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFParse } = require('pdf-parse');

async function testPdfExtraction(pdfUrl: string) {
  console.log(`\nTesting: ${pdfUrl}`);
  try {
    console.log('  Downloading...');
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      maxContentLength: 10 * 1024 * 1024,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      },
    });
    
    console.log(`  Downloaded ${response.data.byteLength} bytes`);
    console.log(`  Content-Type: ${response.headers['content-type']}`);
    
    console.log('  Parsing PDF...');
    const parser = new PDFParse({ data: Buffer.from(response.data) });
    const textRes = await parser.getText();
    const text = (textRes?.text || '').trim();
    await parser.destroy().catch(() => {});
    
    console.log(`  ✓ Extracted ${text.length} characters`);
    if (text.length > 0) {
      console.log(`  Preview: ${text.slice(0, 200)}...`);
    }
    
    return text.length;
  } catch (e) {
    const err = e as Error;
    console.error(`  ✗ Error: ${err.message}`);
    if (err.stack) {
      console.error(`  Stack trace:`);
      console.error(err.stack.split('\n').slice(0, 5).join('\n'));
    }
    return 0;
  }
}

async function main() {
  const pdfs = [
    'https://egymonuments.com/storage/events/May2024/37xm8uMRkKT2bSPmqLmQ.pdf',
    'https://egymonuments.com/storage/events/September2024/StG980l83pM43b6r5cKk.pdf',
    'https://egymonuments.com/storage/events/September2024/HkyD88sjsnuI1FsJWRWf.pdf',
  ];
  
  console.log('Testing PDF extraction on 3 known PDFs...\n');
  console.log('='.repeat(70));
  
  const results = [];
  for (const pdf of pdfs) {
    const chars = await testPdfExtraction(pdf);
    results.push({ pdf, chars });
    console.log('='.repeat(70));
  }
  
  console.log('\nSummary:');
  results.forEach(({ pdf, chars }) => {
    const filename = pdf.split('/').pop();
    console.log(`  ${filename}: ${chars} chars ${chars > 100 ? '✓' : '✗'}`);
  });
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
