import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { recalculateAllPPS } from '../systems/pps.js';

export function startPPSCron() {
  // Every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    const cronLogger = logger.child({ cron: 'pps', action: 'start' });
    cronLogger.info('Starting PPS recalculation');
    
    try {
      const result = await recalculateAllPPS();
      cronLogger.info({ processed: result.processed, action: 'complete' }, 'PPS recalculation complete');
    } catch (error) {
      cronLogger.error({ error, action: 'failed' }, 'PPS recalculation failed');
    }
  });
}
