import { Request, Response, NextFunction } from 'express';

// Mc'Gyver has exactly one legitimate user. There is no signup flow, no
// user table, no OAuth surface - just one long-lived secret you generate
// yourself and put in .env. Every request needs it. This is deliberately
// simpler than Mc'Gy's auth because a bigger surface here is pure downside.
export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.OWNER_TOKEN;
  
  // A public deployment must fail closed when its owner secret is missing.
  if (!expected || expected === 'change-me-to-a-long-random-string' || expected.trim() === '') {
    console.error('[MCGYVER] OWNER_TOKEN is not configured - denying private API access');
    res.status(503).json({ error: 'Private access is not configured' });
    return;
  }

  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  // If no token provided but configured, reject
  if (!token) {
    res.status(401).json({ error: 'Unauthorized - OWNER_TOKEN required' });
    return;
  }

  // Check token match
  if (token !== expected) {
    res.status(401).json({ error: 'Unauthorized - invalid token' });
    return;
  }

  next();
}
