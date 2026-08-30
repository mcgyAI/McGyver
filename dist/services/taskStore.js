"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAllTasks = loadAllTasks;
exports.saveTask = saveTask;
const db_1 = require("./db");
let fallback = [];
async function loadAllTasks() {
    try {
        const db = (0, db_1.getDb)();
        const docs = await db.collection('tasks').find({}).toArray();
        return docs.map((d) => ({
            id: d.id,
            title: d.title,
            project: d.project,
            status: d.status,
            dueDate: d.dueDate,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
        }));
    }
    catch (e) {
        console.warn('[MCGYVER] Task load falling back to in-process store:', e.message);
        return fallback;
    }
}
async function saveTask(task) {
    try {
        const db = (0, db_1.getDb)();
        await db.collection('tasks').updateOne({ id: task.id }, { $set: task }, { upsert: true });
    }
    catch (e) {
        console.warn('[MCGYVER] Task save falling back to in-process store:', e.message);
        fallback = [...fallback.filter(t => t.id !== task.id), task];
    }
}
//# sourceMappingURL=taskStore.js.map