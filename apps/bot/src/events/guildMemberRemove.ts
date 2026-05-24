import { Events } from 'discord.js';
import type { Event } from '../types/discord.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';
import { logImmigrationEvent } from '../systems/immigration.js';

export const guildMemberRemoveEvent: Event<any> = {
  name: Events.GuildMemberRemove,
  once: false,
  async execute(member: any) {
    if (member.user.bot) return;
    
    const guildId = member.guild.id;
    const discordId = member.user.id;
    
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    if (!nation) return; 
    
    // Log departure. Does NOT deport (citizenship persists).
    await logImmigrationEvent(discordId, guildId, 'exit', 'manual', null, 'User left Discord server');
  },
};
