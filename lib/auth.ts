import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';

type Handler = (req: NextApiRequest, res: NextApiResponse, session: any) => Promise<void>;

// Wrap any admin API route with this to require authentication
export function withAdminAuth(handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return handler(req, res, session);
  };
}
