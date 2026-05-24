import type { Request, Response, NextFunction } from 'express';

export function nationGuard(req: Request, res: Response, next: NextFunction) {
  const guildId = req.params.guildId;
  const user = (req as any).user as any;
  
  if (!user || !user.managed_guilds || !user.managed_guilds.includes(guildId)) {
    return res.status(403).json({ error: 'Forbidden: You do not manage this nation' });
  }
  
  next();
}
