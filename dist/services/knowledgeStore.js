"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAllKnowledge = loadAllKnowledge;
exports.persistKnowledge = persistKnowledge;
const db_1 = require("./db");
let fallback = [];
async function loadAllKnowledge() {
    try {
        const db = (0, db_1.getDb)();
        const docs = await db.collection('knowledge').find({}).toArray();
        return docs.map((d) => ({
            id: d.id,
            type: d.type,
            title: d.title,
            content: d.content,
            addedAt: d.addedAt,
        }));
    }
    catch (e) {
        console.warn('[MCGYVER] Knowledge load falling back to in-process store:', e.message);
        return fallback;
    }
}
async function persistKnowledge(source) {
    try {
        const db = (0, db_1.getDb)();
        await db.collection('knowledge').updateOne({ id: source.id }, { $set: source }, { upsert: true });
    }
    catch (e) {
        console.warn('[MCGYVER] Knowledge save falling back to in-process store:', e.message);
        fallback = [...fallback.filter(s => s.id !== source.id), source];
    }
}
//# sourceMappingURL=knowledgeStore.js.map