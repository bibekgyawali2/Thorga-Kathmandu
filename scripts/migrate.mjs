/**
 * Applies the SQL files in supabase/migrations in filename order.
 *
 * Every file that has already run is recorded in the schema_migrations table
 * and skipped on the next run, so this is safe to run repeatedly. Each file
 * runs inside a transaction: if any statement fails, that whole file is rolled
 * back and nothing is recorded.
 *
 *   node scripts/migrate.mjs          apply pending migrations
 *   node scripts/migrate.mjs --status show what has and has not run
 *   node scripts/migrate.mjs --dry    list what would run, change nothing
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");

function loadEnv() {
  // Values already in the environment win, so CI can override the file.
  for (const file of [".env.local", ".env"]) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

function sslConfig() {
  if (process.env.DATABASE_CA_CERT) {
    return { ca: process.env.DATABASE_CA_CERT };
  }
  // Supabase serves a chain the default trust store does not recognise. This
  // is a one-off admin script run by hand against a known host, so it connects
  // without chain verification and says so. The application server is stricter:
  // set DATABASE_CA_CERT there.
  console.warn(
    "  ! DATABASE_CA_CERT is not set, connecting without certificate verification.\n" +
      "    Fine for a manual migration run; set it for the deployed app."
  );
  return { rejectUnauthorized: false };
}

async function main() {
  loadEnv();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Add it to .env.local and try again.");
    process.exit(1);
  }

  if (!existsSync(migrationsDir)) {
    console.error(`No migrations directory at ${migrationsDir}`);
    process.exit(1);
  }

  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  const statusOnly = process.argv.includes("--status");
  const dryRun = process.argv.includes("--dry");

  const client = new pg.Client({
    connectionString,
    ssl: sslConfig(),
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  console.log(`  connected to ${new URL(connectionString.replace(/^postgres(ql)?:/, "http:")).hostname}\n`);

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const { rows } = await client.query("SELECT filename FROM public.schema_migrations");
    const applied = new Set(rows.map((r) => r.filename));

    if (statusOnly) {
      for (const file of files) {
        console.log(`  ${applied.has(file) ? "applied" : "PENDING"}  ${file}`);
      }
      return;
    }

    const pending = files.filter((f) => !applied.has(f));
    if (pending.length === 0) {
      console.log("  Everything is already applied. Nothing to do.");
      return;
    }

    if (dryRun) {
      console.log("  Would apply:");
      pending.forEach((f) => console.log(`    ${f}`));
      return;
    }

    for (const file of pending) {
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      process.stdout.write(`  applying ${file} ... `);
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO public.schema_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log("done");
      } catch (error) {
        await client.query("ROLLBACK");
        console.log("FAILED");
        console.error(`\n  ${file} was rolled back. Nothing from it was applied.`);
        console.error(`  ${error.message}\n`);
        process.exitCode = 1;
        return;
      }
    }

    console.log("\n  All migrations applied.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration run failed:", error.message);
  process.exit(1);
});
