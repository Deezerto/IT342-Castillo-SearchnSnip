const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.wbqvhrdcrplkbpfbofiu:EB1umJCBRFfWjrBo@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'services'`);
  console.log("COLUMNS:", res.rows);
  
  const data = await client.query(`SELECT * FROM services LIMIT 5`);
  console.log("DATA:", data.rows);
  await client.end();
}
run().catch(console.error);
