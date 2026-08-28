"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = connectDb;
exports.closeDb = closeDb;
exports.getDb = getDb;
const mongodb_1 = require("mongodb");
// This connects ONLY to Mc'Gyver's own database. There is no code path
// anywhere in this repo that reaches Mc'Gy's database - that boundary is
// enforced by never importing Mc'Gy's connection code, not by a runtime
// check. Keep it that way: don't import from a shared "db" package that
// both services touch.
let client = null;
let db = null;
async function connectDb() {
    if (db)
        return db;
    const url = process.env.MONGO_URL || 'mongodb://localhost:27017/mcgyver-private';
    console.log('[MCGYVER] Connecting to private database...');
    client = new mongodb_1.MongoClient(url, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        retryWrites: true,
    });
    await client.connect();
    db = client.db();
    console.log('[MCGYVER] Private database connected:', db.databaseName);
    return db;
}
async function closeDb() {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
}
function getDb() {
    if (!db)
        throw new Error('Database not connected yet - call connectDb() first');
    return db;
}
//# sourceMappingURL=db.js.map