import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation, VisaType } from '@bloxive/shared';
import { issueVisa, getActiveVisas } from '../systems/visa.js';

export const visaCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('visa')
    .setDescription('Visa management system')
    .addSubcommand(sub => 
      sub.setName('issue')
        .setDescription('Issue a visa manually')
        .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
        .addStringOption(opt => opt.setName('type').setDescription('Visa type').setRequired(true)
          .addChoices(
            { name: 'Tourist', value: 'tourist' },
            { name: 'Resident', value: 'resident' },
            { name: 'Work', value: 'work' },
            { name: 'Diplomatic', value: 'diplomatic' }
          ))
        .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in days').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List active visas for a user')
        .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
    )
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('user', true);
    
    if (subcommand === 'issue') {
      const type = interaction.options.getString('type', true) as VisaType;
      const duration = interaction.options.getInteger('duration');
      
      await issueVisa(targetUser.id, guildId, guildId, type, 'manual', interaction.user.id, duration);
      
      await interaction.reply({ 
        content: t('visa.issued', locale, { type, username: targetUser.username, nation: nation?.name ?? 'Nation' }) 
      });
    } else if (subcommand === 'list') {
      const visas = await getActiveVisas(targetUser.id);
      const localVisas = visas.filter(v => v.target_guild_id === guildId);
      
      let content = `**Visas for ${targetUser.username}**\n`;
      if (localVisas.length === 0) content += t('passport.no_visas', locale);
      for (const v of localVisas) {
        content += `- ${v.type.toUpperCase()} (Expires: ${v.expires_at ? v.expires_at.toISOString().split('T')[0] : 'Never'})\n`;
      }
      
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    }
  },
};
