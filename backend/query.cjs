const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res1 = await client.query('SELECT COUNT(*) FROM "Material"');
  console.log('Material Count:', res1.rows[0].count);
  
  const res2 = await client.query('SELECT id, "materialName", unit, category FROM "Material" LIMIT 20');
  console.log('Materials:', res2.rows);
  
  await client.end();
}

run().catch(console.error);
