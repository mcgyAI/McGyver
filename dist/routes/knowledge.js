"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ParserManager_1 = require("../core/parsers/ParserManager");
const knowledgeRegistry_1 = require("../core/registries/knowledgeRegistry");
const router = (0, express_1.Router)();
router.post('/knowledge', async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: 'Missing required fields: title, content' });
        }
        const source = await ParserManager_1.parserManager.ingestText(title, content);
        res.json({ success: true, source });
    }
    catch (e) {
        console.error('[MCGYVER] Knowledge add error:', e);
        res.status(500).json({ error: e.message });
    }
});
router.get('/knowledge', (_req, res) => {
    res.json({ success: true, sources: knowledgeRegistry_1.knowledgeRegistry.all() });
});
exports.default = router;
//# sourceMappingURL=knowledge.js.map