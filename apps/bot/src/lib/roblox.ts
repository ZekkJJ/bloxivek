import { loggers } from './logger.js';
import { randomBytes } from 'node:crypto';

const log = loggers.roblox;

const ROBLOX_USERS_API = 'https://users.roblox.com/v1';

export interface RobloxUserInfo {
  id: number;
  name: string;
  displayName: string;
  description: string;
  created: string;
  isBanned: boolean;
  externalAppDisplayName: string;
  hasVerifiedBadge: boolean;
}

// In-memory code tracking
interface VerificationSession {
  discordId: string;
  robloxUsername: string;
  code: string;
  expiresAt: number;
}

const sessions = new Map<string, VerificationSession>(); // map key is discordId

setInterval(() => {
  const now = Date.now();
  for (const [key, session] of sessions) {
    if (session.expiresAt < now) {
      sessions.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export function generateVerificationCode(discordId: string, robloxUsername: string): string {
  const code = `BLX-${randomBytes(3).toString('hex').toUpperCase()}`;
  
  sessions.set(discordId, {
    discordId,
    robloxUsername,
    code,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
  
  return code;
}

export function getVerificationSession(discordId: string): VerificationSession | undefined {
  const session = sessions.get(discordId);
  if (session && session.expiresAt > Date.now()) {
    return session;
  }
  return undefined;
}

export function clearVerificationSession(discordId: string): void {
  sessions.delete(discordId);
}

export async function getRobloxUserByUsername(username: string): Promise<RobloxUserInfo | null> {
  try {
    const searchRes = await fetch(`${ROBLOX_USERS_API}/usernames/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: true
      })
    });
    
    if (!searchRes.ok) throw new Error(`Search failed ${searchRes.status}`);
    const searchData = await searchRes.json() as any;
    
    if (!searchData.data || searchData.data.length === 0) return null;
    
    const userId = searchData.data[0].id;
    
    const userRes = await fetch(`${ROBLOX_USERS_API}/users/${userId}`);
    if (!userRes.ok) throw new Error(`User fetch failed ${userRes.status}`);
    
    const userData = await userRes.json() as RobloxUserInfo;
    return userData;
  } catch (err) {
    log.error({ username, err }, 'Failed to fetch Roblox user');
    return null;
  }
}

export async function getAvatarHeadshot(robloxId: string, size: string = '420x420'): Promise<string | null> {
  const params = new URLSearchParams({
    userIds: robloxId,
    size,
    format: 'Png',
    isCircular: 'false',
  });
  
  try {
    const response = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?${params.toString()}`);
    
    if (!response.ok) return null;
    
    const data = await response.json() as any;
    const avatar = data.data?.[0];
    
    if (!avatar || avatar.state !== 'Completed') return null;
    return avatar.imageUrl;
  } catch (err) {
    return null;
  }
}
