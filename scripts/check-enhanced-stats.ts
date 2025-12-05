import 'dotenv/config';
import { firebaseAdmin } from '../src/config/firebase';

async function checkStats() {
  const db = firebaseAdmin.firestore();
  const col = db.collection('egymonuments_pages_enhanced');
  
  const snapshot = await col.get();
  console.log(`Total documents: ${snapshot.size}`);
  
  let withPdf = 0;
  let withExternal = 0;
  const pdfDetails: Array<{ url: string; count: number }> = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.pdfContent && Array.isArray(data.pdfContent)) {
      withPdf++;
      pdfDetails.push({ url: data.url, count: data.pdfContent.length });
    }
    if (data.externalReferences && Array.isArray(data.externalReferences)) {
      withExternal++;
    }
  });
  
  console.log(`\nDocuments with PDF content: ${withPdf}`);
  console.log(`Documents with external references: ${withExternal}`);
  
  if (pdfDetails.length > 0) {
    console.log('\nPDF extraction details:');
    pdfDetails.forEach(({ url, count }) => {
      console.log(`  ${url}: ${count} PDF(s)`);
    });
  }
  
  process.exit(0);
}

checkStats().catch(err => {
  console.error(err);
  process.exit(1);
});
