import { loggers } from './logger.js';

const log = loggers.r2;

export async function uploadDni(guildId: string, discordId: string, buffer: Buffer): Promise<string> {
  log.info({ guildId, discordId }, 'DNI upload skipped (R2 disabled)');
  return 'https://placehold.co/600x400/png?text=DNI+R2+Disabled';
}

export async function uploadPreview(guildId: string, buffer: Buffer): Promise<string> {
  log.info({ guildId }, 'Preview upload skipped (R2 disabled)');
  return 'https://placehold.co/600x400/png?text=Preview+R2+Disabled';
}

export async function uploadAsset(path: string, buffer: Buffer, contentType: string): Promise<string> {
  log.info({ path }, 'Asset upload skipped (R2 disabled)');
  return 'https://placehold.co/600x400/png?text=Asset+R2+Disabled';
}

export async function deleteAsset(key: string): Promise<void> {
  log.info({ key }, 'Asset delete skipped (R2 disabled)');
}
