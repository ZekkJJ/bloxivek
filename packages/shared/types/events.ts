import { ObjectId } from 'mongodb';
import type { LawCase } from './law.js';
import type { LedgerEntry } from './economy.js';
import type { Alliance } from './diplomacy.js';
import type { PrestigeTier } from './nation.js';

export type WSEvent =
  | { type: 'LAW_CASE_CREATED'; payload: LawCase }
  | { type: 'LAW_CASE_UPDATED'; payload: LawCase }
  | { type: 'ECONOMY_TRANSACTION'; payload: LedgerEntry }
  | { type: 'CITIZEN_ENTERED'; payload: { discord_id: string; guild_id: string; method: string } }
  | { type: 'CITIZEN_LEFT'; payload: { discord_id: string; guild_id: string } }
  | { type: 'PRESTIGE_UPDATED'; payload: { guild_id: string; tier: PrestigeTier; score: number } }
  | { type: 'ALLIANCE_STATUS_CHANGED'; payload: Alliance }
  | { type: 'COMPANY_CREATED'; payload: { guild_id: string; company_id: string; name: string } }
  | { type: 'CONFIG_UPDATED'; payload: { guild_id: string; section: string } };

export type ActorType = 'admin' | 'owner' | 'system' | 'cron';

export interface AuditLogEntry {
  _id: ObjectId;
  guild_id: string;
  actor_discord_id: string;
  actor_type: ActorType;
  action: string;
  target_type: string | null;
  target_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: Date;
}

export interface DniTemplate {
  _id: ObjectId;
  guild_id: string;
  background_url: string | null;
  primary_color: string;
  text_color: string;
  secondary_text_color: string;
  overlay_color: string;
  overlay_opacity: number;
  logo_url: string | null;
  watermark_url: string | null;
  font: string;
  border_style: 'solid' | 'double' | 'dotted' | 'none';
  border_color: string;
  border_width: number;
  security_pattern: 'guilloche' | 'microtext' | 'none';
  header_text: string;
  subtitle_text: string;
  preview_url: string | null;
  updated_at: Date;
}
