"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const toolRegistry_1 = require("../core/registries/toolRegistry");
const router = (0, express_1.Router)();
router.get('/files', async (_req, res) => {
    try {
        const tool = toolRegistry_1.toolRegistry.get('files.list');
        if (!tool)
            return res.status(500).json({ error: 'files.list not registered' });
        const files = await tool.handler({});
        res.json({ success: true, files });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/files/read', async (req, res) => {
    try {
        const { path } = req.body;
        if (!path)
            return res.status(400).json({ error: 'Missing required field: path' });
        const tool = toolRegistry_1.toolRegistry.get('files.read');
        if (!tool)
            return res.status(500).json({ error: 'files.read not registered' });
        const content = await tool.handler({ path });
        res.json({ success: true, content });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=files.js.map