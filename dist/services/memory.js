"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMemory = loadMemory;
exports.saveMemory = saveMemory;
exports.clearMemory = clearMemory;
const db_1 = require("./db");
const MAX_TURNS = 40; // Mc'Gyver can afford a much longer window than Mc'Gy -
// it's one conversation thread with one person, not
// thousands of concurrent app users.
let fallback = [];
async function loadMemory() {
    try {
        const db = (0, db_1.getDb)();
        const doc = await db.collection('memory').findOne({ _id: 'owner' });
        if (doc && Array.isArray(doc.messages))
            return doc.messages;
        return [];
    }
    catch (e) {
        console.warn('[MCGYVER] Memory load falling back to in-process store:', e.message);
        return fallback;
    }
}
async function saveMemory(messages) {
    const trimmed = messages.slice(-MAX_TURNS * 2);
    try {
        const db = (0, db_1.getDb)();
        await db.collection('memory').updateOne({ _id: 'owner' }, { $set: { messages: trimmed, updatedAt: new Date() } }, { upsert: true });
    }
    catch (e) {
        console.warn('[MCGYVER] Memory save falling back to in-process store:', e.message);
        fallback = trimmed;
    }
}
async function clearMemory() {
    fallback = [];
    try {
        const db = (0, db_1.getDb)();
        await db.collection('memory').deleteOne({ _id: 'owner' });
    }
    catch {
        // fallback already cleared above
    }
}
//# sourceMappingURL=memory.js.map