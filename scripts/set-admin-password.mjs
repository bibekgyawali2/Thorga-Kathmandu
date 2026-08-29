/**
 * Sets an administrator's password directly in the database.
 *
 *   node scripts/set-admin-password.mjs <email> '<new password>'
 *   node scripts/set-admin-password.mjs --list
 *
 * The password is hashed with PBKDF2-HMAC-SHA256 before it is stored, using
 * the same parameters as src/lib/password.ts, so the value never touches the
 * database in plaintext. Nothing is printed except the account it changed.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

function loadEnv() {
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

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_BYTES);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_BYTES, "sha256");
  return `pbkdf2$${ITERATIONS}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

async function main() {
  loadEnv();

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  const listOnly = process.argv.includes("--list");
  const [email, password] = process.argv.slice(2);

  if (!listOnly && (!email || !password)) {
    console.error("Usage: node scripts/set-admin-password.mjs <email> '<new password>'");
    console.error("       node scripts/set-admin-password.mjs --list");
    process.exit(1);
  }

  if (!listOnly && password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_CA_CERT
      ? { ca: process.env.DATABASE_CA_CERT }
      : { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  await client.connect();
  try {
    const res = await client.query("SELECT value FROM public.site_settings WHERE key = 'admin_users'");
    const users = res.rows[0]?.value;
    if (!Array.isArray(users)) {
      console.error("No admin_users record found in site_settings.");
      process.exit(1);
    }

    if (listOnly) {
      console.log("Administrator accounts:\n");
      for (const u of users) {
        const state = !u.password
          ? "no password set"
          : String(u.password).startsWith("pbkdf2$")
          ? "hashed"
          : "PLAINTEXT (change this)";
        console.log(`  ${u.email}\n    role=${u.role}  active=${u.isActive}  password: ${state}\n`);
      }
      return;
    }

    const target = users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (!target) {
      console.error(`No account with email ${email}. Run with --list to see the accounts.`);
      process.exit(1);
    }

    const updated = users.map((u) =>
      u === target ? { ...u, password: hashPassword(password), isActive: true } : u
    );

    await client.query(
      "UPDATE public.site_settings SET value = $1, updated_at = NOW() WHERE key = 'admin_users'",
      [JSON.stringify(updated)]
    );

    console.log(`Password updated and hashed for ${target.email} (role: ${target.role}).`);
    console.log("The account is active. Sign in at /admin with that email.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
