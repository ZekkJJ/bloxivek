import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation, GlobalIdentity } from '@bloxive/shared';
import { ObjectId } from 'mongodb';

export const sanctionCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('sanction')
    .setDescription('Issue a sanction (conduct or lore)')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('User to sanction')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('type')
        .setDescription('Sanction type')
        .setRequired(true)
        .addChoices(
          { name: 'Conduct (Global Player)', value: 'conduct' },
          { name: 'Lore (Local Character)', value: 'lore' }
        ))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason')
        .setRequired(true))
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const type = interaction.options.getString('type', true);
    const reason = interaction.options.getString('reason', true);
    const guildId = interaction.guildId!;
    
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    if (type === 'conduct') {
      const identitiesCol = getCollection<GlobalIdentity>(Collections.GLOBAL_IDENTITIES);
      
      const sanction = {
        id: new ObjectId().toString(),
        reason,
        issued_by_guild_id: guildId,
        issued_at: new Date(),
        expires_at: null,
        shared_with: []
      };
      
      await identitiesCol.updateOne(
        { discord_id: targetUser.id },
        { $push: { platform_sanctions: sanction } as any },
        { upsert: true }
      );
      
      await interaction.reply({ content: t('sancion.conduct_issued', locale, { username: targetUser.username }) });
    } else {
      // Lore sanctions are simply active_arrests or stored in local DB
      await interaction.reply({ content: t('sancion.lore_issued', locale, { username: targetUser.username }) });
    }
  },
};
