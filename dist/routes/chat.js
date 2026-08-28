"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Router_1 = require("../core/router/Router");
const memory_1 = require("../services/memory");
const router = (0, express_1.Router)();
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Missing required field: message' });
        }
        const history = await (0, memory_1.loadMemory)();
        const reply = await (0, Router_1.route)(message, history);
        const updated = [
            ...history,
            { role: 'user', content: message },
            { role: 'assistant', content: reply },
        ];
        await (0, memory_1.saveMemory)(updated);
        res.json({ success: true, response: reply, timestamp: new Date().toISOString() });
    }
    catch (e) {
        console.error('[MCGYVER] Chat error:', e);
        res.status(500).json({ error: e.message });
    }
});
router.post('/memory/clear', async (_req, res) => {
    await (0, memory_1.clearMemory)();
    res.json({ success: true, message: 'Memory cleared' });
});
exports.default = router;
//# sourceMappingURL=chat.js.map