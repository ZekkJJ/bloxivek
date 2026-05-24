import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { loggers } from './lib/logger.js';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import { connect, ensureIndexes, disconnect } from './lib/db.js';
import { config } from 'dotenv';
import { readyEvent } from './events/ready.js';
import { interactionCreateEvent } from './events/interactionCreate.js';
import { guildCreateEvent } from './events/guildCreate.js';
import { helpCommand } from './commands/help.js';
import { vincularCommand } from './commands/vincular.js';
import { setupCommand } from './commands/setup.js';
import { perfilCommand } from './commands/perfil.js';
import { balanceCommand } from './commands/balance.js';
import { payCommand } from './commands/pay.js';
import { configCommand } from './commands/config.js';

config(); // Load .env
const log = loggers.bot;

// Extend Client to hold commands
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, any>;
  }
}

async function bootstrap() {
  try {
    // 1. Connect to Database
    log.info('Connecting to MongoDB...');
    await connect();
    await ensureIndexes();
    log.info('MongoDB connected and indexes verified');

    // 2. Initialize Discord Client
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
      ],
      partials: [Partials.GuildMember, Partials.User],
    });

    client.commands = new Collection();

    // 3. Register Commands
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      // use dynamic import
      const fileUrl = new URL(`file://${filePath}`).href;
      const cmdModule = await import(fileUrl);
      
      // Find the exported command object
      const cmd = Object.values(cmdModule).find((exp: any) => exp && exp.data && exp.data.name) as any;
      
      if (cmd) {
        client.commands.set(cmd.data.name, cmd);
      }
    }

    // 4. Register Events
    client.once(readyEvent.name, (...args) => readyEvent.execute(client, ...args));
    client.on(interactionCreateEvent.name, (...args) => interactionCreateEvent.execute(client, ...args));
    client.on(guildCreateEvent.name, (...args) => guildCreateEvent.execute(client, ...args));

    // 5. Login
    if (!process.env.DISCORD_TOKEN) {
      throw new Error('DISCORD_TOKEN is missing');
    }
    await client.login(process.env.DISCORD_TOKEN);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      log.info(`Received ${signal}. Shutting down gracefully...`);
      client.destroy();
      await disconnect();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    log.fatal({ err }, 'Fatal error during bootstrap');
    process.exit(1);
  }
}

bootstrap();
