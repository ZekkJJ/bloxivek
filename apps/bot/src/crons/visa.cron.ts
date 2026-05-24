import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { expireVisas } from '../systems/visa.js';

export function startVisaCron() {
  // Midnight
  cron.schedule('0 0 * * *', async () => {
    const cronLogger = logger.child({ cron: 'visa', action: 'start' });
    cronLogger.info('Starting visa expiration');
    
    try {
      const expiredCount = await expireVisas();
      cronLogger.info({ expired: expiredCount, action: 'complete' }, 'Visa expiration complete');
    } catch (error) {
      cronLogger.error({ error, action: 'failed' }, 'Visa expiration failed');
    }
  });
}
