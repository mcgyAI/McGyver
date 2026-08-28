"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOwner = requireOwner;
// Mc'Gyver has exactly one legitimate user. There is no signup flow, no
// user table, no OAuth surface - just one long-lived secret you generate
// yourself and put in .env. Every request needs it. This is deliberately
// simpler than Mc'Gy's auth because a bigger surface here is pure downside.
function requireOwner(req, res, next) {
    const expected = process.env.OWNER_TOKEN;
    if (!expected || expected === 'change-me-to-a-long-random-string') {
        res.status(500).json({ error: 'OWNER_TOKEN is not configured. Set it in .env before running Mc\'Gyver.' });
        return;
    }
    const header = req.header('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token !== expected) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map