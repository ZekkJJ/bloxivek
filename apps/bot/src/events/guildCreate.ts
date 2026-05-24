import { Events } from 'discord.js';
import { loggers } from '../lib/logger.js';
import type { Event } from '../types/discord.js';

const log = loggers.bot;

export const guildCreateEvent: Event<Events.GuildCreate> = {
  name: Events.GuildCreate,
  async execute(client, guild) {
    log.info({ guildId: guild.id, name: guild.name }, 'Joined new guild');
    
    // We don't automatically create a nation record here, 
    // the owner must run /setup.
  },
};
