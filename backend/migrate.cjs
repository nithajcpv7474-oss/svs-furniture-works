const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    
    // Add customMaterialName column
    await client.query('ALTER TABLE "OrderMaterial" ADD COLUMN IF NOT EXISTS "customMaterialName" TEXT NULL;');
    console.log('Added customMaterialName column.');
    
    // Make materialId optional
    await client.query('ALTER TABLE "OrderMaterial" ALTER COLUMN "materialId" DROP NOT NULL;');
    console.log('Made materialId optional.');
    
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
