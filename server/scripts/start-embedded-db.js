import EmbeddedPostgres from 'embedded-postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.join(__dirname, '..', '.data', 'pg');
const alreadyInitialized = fs.existsSync(path.join(databaseDir, 'PG_VERSION'));

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'postgres',
  password: 'postgres',
  port: 5432,
  persistent: true,
});

async function main() {
  console.log('Embedded PostgreSQL data dir:', databaseDir);

  if (!alreadyInitialized) {
    console.log('Initialising new cluster...');
    await pg.initialise();
  } else {
    console.log('Existing cluster found — skipping initdb');
  }

  await pg.start();

  try {
    await pg.createDatabase('ecomm');
    console.log('Created database: ecomm');
  } catch {
    console.log('Database ecomm ready (may already exist)');
  }

  console.log('Embedded PostgreSQL listening on postgresql://postgres:postgres@localhost:5432/ecomm');
  console.log('Keep this process running while developing.');

  const shutdown = async () => {
    console.log('\nStopping embedded PostgreSQL...');
    await pg.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
