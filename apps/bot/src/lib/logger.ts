import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
});

// Pre-configured child loggers for each system
export const loggers = {
  bot: logger.child({ system: 'bot' }),
  db: logger.child({ system: 'db' }),
  economy: logger.child({ system: 'economy' }),
  law: logger.child({ system: 'law' }),
  immigration: logger.child({ system: 'immigration' }),
  identity: logger.child({ system: 'identity' }),
  diplomacy: logger.child({ system: 'diplomacy' }),
  company: logger.child({ system: 'company' }),
  cron: logger.child({ system: 'cron' }),
  api: logger.child({ system: 'api' }),
  roblox: logger.child({ system: 'roblox' }),
  r2: logger.child({ system: 'r2' }),
} as const;

export type SystemLogger = typeof loggers[keyof typeof loggers];
