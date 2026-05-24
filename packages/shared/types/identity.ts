import { ObjectId } from 'mongodb';

export interface PPSBreakdown {
  free_access_nations: number;
  visa_on_arrival_nations: number;
  blocked_nations: number;
  weighted_score: number;
}

export interface PlatformSanction {
  id: string;
  reason: string;
  issued_by_guild_id: string;
  issued_at: Date;
  expires_at: Date | null;
  shared_with: string[]; // guild_ids that honor this sanction
}

export type Locale = 'es' | 'en';

export interface GlobalIdentity {
  _id: ObjectId;
  discord_id: string;
  roblox_id: string | null;
  roblox_username: string | null;
  roblox_avatar_url: string | null;
  verified_at: Date | null;
  preferred_locale: Locale;
  pps: number; // 0-1000
  pps_breakdown: PPSBreakdown;
  platform_sanctions: PlatformSanction[];
  created_at: Date;
  updated_at: Date;
}
