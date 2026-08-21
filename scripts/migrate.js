const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || "50y150p0WOWZzdmc";
  const projectRef = "xyefqkdvtvudqbiqpqmy";

  // Connection candidates
  const connectionStrings = [
    `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
  ];

  let client = null;
  let connected = false;

  for (const connStr of connectionStrings) {
    console.log(`Attempting connection to: ${connStr.replace(dbPassword, "******")}...`);
    try {
      client = new Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
      });
      await client.connect();
      connected = true;
      console.log("Successfully connected to Supabase PostgreSQL database!");
      break;
    } catch (err) {
      console.warn("Connection attempt failed:", err.message);
      if (client) {
        try { await client.end(); } catch (e) {}
      }
    }
  }

  if (!connected || !client) {
    console.error("Could not establish direct TCP connection to database (could be port 5432 / 6543 network block or region pooler).");
    process.exit(1);
  }

  try {
    const schemaPath = path.join(__dirname, "../supabase/schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf8");
    console.log("Running SQL migration from supabase/schema.sql...");
    
    await client.query(sql);
    console.log("SQL Schema migration completed successfully!");

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("Verified Public Tables in Database:");
    res.rows.forEach((row) => console.log(` - ${row.table_name}`));
  } catch (err) {
    console.error("Error executing migration:", err);
  } finally {
    await client.end();
  }
}

runMigration();
