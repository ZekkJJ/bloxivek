import { ObjectId } from 'mongodb';

export type AllianceType = 'recognition' | 'free_transit' | 'security' | 'trade' | 'multilateral';
export type AllianceStatus = 'pending' | 'active' | 'terminated';
export type VisaType = 'tourist' | 'resident' | 'work' | 'diplomatic' | 'fastpass';
export type VisaStatus = 'active' | 'expired' | 'revoked';
export type VisaTier = 'standard' | 'vip';
export type VisaGrantMethod = 'manual' | 'alliance' | 'pps_threshold';
export type ImmigrationEventType = 'entry' | 'exit' | 'deportation' | 'visa_denied' | 'fastpass_used';
export type ImmigrationMethod = 'manual' | 'auto_alliance' | 'auto_pps' | 'fastpass';
export type PassportStatus = 'active' | 'suspended' | 'revoked';

export interface AllianceEffects {
  share_sanctions: boolean;
  auto_fastpass: boolean;
  auto_fastpass_role: string | null;
  trade_terms: string | null;
}

export interface Alliance {
  _id: ObjectId;
  initiator_guild_id: string;
  partner_guild_id: string;
  type: AllianceType;
  status: AllianceStatus;
  member_guild_ids: string[];
  effects: AllianceEffects;
  initiator_accepted_at: Date | null;
  partner_accepted_at: Date | null;
  terminated_at: Date | null;
  terminated_by_guild_id: string | null;
  termination_reason: string | null;
  created_at: Date;
}

export interface Visa {
  _id: ObjectId;
  discord_id: string;
  target_guild_id: string;
  issuing_guild_id: string;
  type: VisaType;
  tier: VisaTier | null;
  status: VisaStatus;
  granted_by: VisaGrantMethod;
  granted_by_discord_id: string | null;
  issued_at: Date;
  expires_at: Date | null;
  alliance_id: ObjectId | null;
}

export interface ImmigrationEvent {
  _id: ObjectId;
  discord_id: string;
  guild_id: string;
  event: ImmigrationEventType;
  method: ImmigrationMethod;
  officer_discord_id: string | null;
  public_note: string | null;
  internal_note: string | null;
  created_at: Date;
}

export interface Passport {
  _id: ObjectId;
  discord_id: string;
  issued_by_guild_id: string;
  citizen_number: string;
  status: PassportStatus;
  issued_at: Date;
  expires_at: Date | null;
}
