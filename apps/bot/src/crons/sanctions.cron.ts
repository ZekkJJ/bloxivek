import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { getCollection, Collections } from '../lib/db.js';
import type { GlobalIdentity } from '@bloxive/shared';

export function startSanctionsCron() {
  // Daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    const cronLogger = logger.child({ cron: 'sanctions', action: 'start' });
    cronLogger.info('Starting sanctions cleanup');
    
    try {
      const identitiesCol = getCollection<GlobalIdentity>(Collections.GLOBAL_IDENTITIES);
      const now = new Date();
      
      const result = await identitiesCol.updateMany(
        { 'platform_sanctions.expires_at': { $lt: now } },
        { $pull: { platform_sanctions: { expires_at: { $lt: now } } } as any }
      );
      
      cronLogger.info({ modified: result.modifiedCount, action: 'complete' }, 'Sanctions cleanup complete');
    } catch (error) {
      cronLogger.error({ error, action: 'failed' }, 'Sanctions cleanup failed');
    }
  });
}
