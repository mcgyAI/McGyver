import { MongoClient, Db } from 'mongodb';

// This connects ONLY to Mc'Gyver's own database. There is no code path
// anywhere in this repo that reaches Mc'Gy's database - that boundary is
// enforced by never importing Mc'Gy's connection code, not by a runtime
// check. Keep it that way: don't import from a shared "db" package that
// both services touch.

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (db) return db;

  const url = process.env.MONGO_URL || 'mongodb://localhost:27017/mcgyver-private';
  console.log('[MCGYVER] Connecting to private database...');

  client = new MongoClient(url, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    retryWrites: true,
  });

  await client.connect();
  db = client.db();
  console.log('[MCGYVER] Private database connected:', db.databaseName);
  return db;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected yet - call connectDb() first');
  return db;
}
