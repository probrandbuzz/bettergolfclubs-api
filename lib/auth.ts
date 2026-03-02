import type { NextApiRequest, NextApiResponse } from 'next';

type Handler = (req: NextApiRequest, res: NextApiResponse, session: any) => Promise<void>;

function verifyToken(token: string): any | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
    const [header, body, sig] = token.split('.');
    const { createHmac } = require('crypto');
    const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

export function withAdminAuth(handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Accept Bearer token from admin panel HTML
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = verifyToken(token);
      if (payload) {
        return handler(req, res, { user: payload });
      }
    }

    return res.status(401).json({ error: 'Unauthorized' });
  };
}
