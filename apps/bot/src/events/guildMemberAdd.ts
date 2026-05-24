import { Events } from 'discord.js';
import type { Event } from '../types/discord.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';
import { logImmigrationEvent } from '../systems/immigration.js';

export const guildMemberAddEvent: Event<any> = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member: any) {
    if (member.user.bot) return;
    
    const guildId = member.guild.id;
    const discordId = member.user.id;
    
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    if (!nation) return; // Not set up
    
    // Determine border logic based on config
    const mode = nation.config.border.mode;
    
    if (mode === 'open') {
      await logImmigrationEvent(discordId, guildId, 'entry', 'manual', null, 'Open borders entry');
    } else if (mode === 'closed') {
      await logImmigrationEvent(discordId, guildId, 'visa_denied', 'manual', null, 'Border is closed');
      // A real strict system might kick them here, but we just log for now to allow them to register later if borders open
    } else {
      // Logic for tier_gated or application goes here
      await logImmigrationEvent(discordId, guildId, 'entry', 'manual', null, `Entry under ${mode} mode`);
    }
  },
};
