import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

// 1. Resolve Connection String
const localEnv = loadEnvFile(path.join(projectRoot, ".env.local"));
const baseEnv = loadEnvFile(path.join(projectRoot, ".env"));

// Look for --db-url argument
let connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || localEnv.DATABASE_URL || baseEnv.DATABASE_URL;

const argIdx = process.argv.findIndex((arg) => arg === "--db-url" || arg === "-u");
if (argIdx !== -1 && process.argv[argIdx + 1]) {
  connectionString = process.argv[argIdx + 1];
}

if (!connectionString) {
  console.log(`
\x1b[33m⚠️  No DATABASE_URL provided.\x1b[0m

To push migrations and seed data directly from your terminal, provide your Supabase PostgreSQL connection string.

\x1b[1mHow to find your connection string:\x1b[0m
1. Open your Supabase Dashboard: \x1b[36mhttps://supabase.com/dashboard/project/xyhnyeipxnfhzcstdwtm/settings/database\x1b[0m
2. Scroll to \x1b[1m"Connection string"\x1b[0m -> Click \x1b[1m"URI"\x1b[0m
3. Copy the URI and replace \x1b[33m[YOUR-PASSWORD]\x1b[0m with your actual database password:
   \x1b[32mpostgresql://postgres:[YOUR-PASSWORD]@db.xyhnyeipxnfhzcstdwtm.supabase.co:5432/postgres\x1b[0m
   (or the Transaction Pooler URI on port 6543)

\x1b[1mRun the command directly:\x1b[0m
  \x1b[32mnpm run db:push -- --db-url "postgresql://postgres:[PASSWORD]@db.xyhnyeipxnfhzcstdwtm.supabase.co:5432/postgres"\x1b[0m

\x1b[1mOr add it to your .env.local:\x1b[0m
  DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xyhnyeipxnfhzcstdwtm.supabase.co:5432/postgres
  \x1b[32mnpm run db:push\x1b[0m
`);
  process.exit(1);
}

// 2. Connect to Database
console.log(`\n\x1b[36mConnecting to Supabase Database...\x1b[0m`);
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

try {
  await client.connect();
  console.log(`\x1b[32m✓ Connected to PostgreSQL successfully!\x1b[0m\n`);

  // 3. Read and execute migration files
  const migrationsDir = path.join(projectRoot, "supabase", "migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`\x1b[1mApplying ${migrationFiles.length} database migrations...\x1b[0m`);
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");
    process.stdout.write(`  ⏳ Running ${file}... `);
    await client.query(sql);
    console.log(`\x1b[32m[DONE]\x1b[0m`);
  }

  // 4. Read and execute seed.sql
  const seedPath = path.join(projectRoot, "supabase", "seed.sql");
  if (fs.existsSync(seedPath)) {
    console.log(`\n\x1b[1mSeeding 41-Day Curriculum...\x1b[0m`);
    process.stdout.write(`  ⏳ Running seed.sql... `);
    const seedSql = fs.readFileSync(seedPath, "utf-8");
    await client.query(seedSql);
    console.log(`\x1b[32m[DONE]\x1b[0m`);
  }

  // 5. Verification query
  console.log(`\n\x1b[1mVerifying populated records...\x1b[0m`);
  const { rows: challenges } = await client.query(`select count(*) as count from public.challenges;`);
  const { rows: phases } = await client.query(`select count(*) as count from public.phases;`);
  const { rows: days } = await client.query(`select count(*) as count from public.challenge_days;`);
  const { rows: activities } = await client.query(`select count(*) as count from public.activities;`);
  const { rows: checklists } = await client.query(`select count(*) as count from public.checklist_items;`);

  console.log(`  ✓ Challenges:      ${challenges[0].count}`);
  console.log(`  ✓ Learning Phases: ${phases[0].count} / 6`);
  console.log(`  ✓ Challenge Days:  ${days[0].count} / 41`);
  console.log(`  ✓ Activities:      ${activities[0].count} (Speaking + Writing)`);
  console.log(`  ✓ Checklists:      ${checklists[0].count} items`);

  console.log(`\n\x1b[32m🎉 Database successfully migrated and seeded with the full 41-day curriculum!\x1b[0m\n`);
} catch (err) {
  console.error(`\n\x1b[31m❌ Error executing database script:\x1b[0m\n`, err);
  process.exit(1);
} finally {
  await client.end();
}
