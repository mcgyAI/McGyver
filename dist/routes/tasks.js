"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskStore_1 = require("../services/taskStore");
const taskManager_1 = require("../services/taskManager");
const router = (0, express_1.Router)();
router.get('/tasks', async (_req, res) => {
    const tasks = await (0, taskStore_1.loadAllTasks)();
    res.json({ success: true, tasks });
});
router.post('/tasks', async (req, res) => {
    try {
        const { title, project, dueDate } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Missing required field: title' });
        }
        const task = await (0, taskManager_1.createTask)(title, project, dueDate);
        res.json({ success: true, task });
    }
    catch (e) {
        console.error('[MCGYVER] Task create error:', e);
        res.status(500).json({ error: e.message });
    }
});
router.post('/tasks/:id/complete', async (req, res) => {
    try {
        const task = await (0, taskManager_1.completeTaskById)(req.params.id);
        if (!task)
            return res.status(404).json({ error: 'Task not found' });
        res.json({ success: true, task });
    }
    catch (e) {
        console.error('[MCGYVER] Task complete error:', e);
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map