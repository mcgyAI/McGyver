"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const capabilityRegistry_1 = require("../core/registries/capabilityRegistry");
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        service: 'mcgyver',
        private: true,
        capabilities: capabilityRegistry_1.capabilityRegistry.list(),
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=health.js.map