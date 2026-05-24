import { Events, REST, Routes } from 'discord.js';
import { loggers } from '../lib/logger.js';
import type { Event } from '../types/discord.js';

const log = loggers.bot;

export const readyEvent: Event<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  async execute(client, readyClient) {
    log.info(`Logged in as ${readyClient.user.tag}`);
    
    // Register global slash commands
    try {
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
      const commands = client.commands.map(cmd => cmd.data.toJSON());
      
      log.info(`Started refreshing ${commands.length} application (/) commands.`);
      
      await rest.put(
        Routes.applicationCommands(readyClient.user.id),
        { body: commands },
      );
      
      log.info(`Successfully reloaded application (/) commands.`);
    } catch (error) {
      log.error({ err: error }, 'Failed to register application commands');
    }
  },
};
