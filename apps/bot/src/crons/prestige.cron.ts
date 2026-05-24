import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { recalculateAllPrestige } from '../systems/prestige.js';

export function startPrestigeCron() {
  // Daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    const cronLogger = logger.child({ cron: 'prestige', action: 'start' });
    cronLogger.info('Starting prestige recalculation');
    
    try {
      const result = await recalculateAllPrestige();
      cronLogger.info({ processed: result.processed, action: 'complete' }, 'Prestige recalculation complete');
    } catch (error) {
      cronLogger.error({ error, action: 'failed' }, 'Prestige recalculation failed');
    }
  });
}
