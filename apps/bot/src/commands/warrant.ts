import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation, LawCase } from '@bloxive/shared';

export const warrantCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('warrant')
    .setDescription('Issue a search warrant for a citizen')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('Citizen to target')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for the warrant')
        .setRequired(true))
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const guildId = interaction.guildId!;
    const officerId = interaction.user.id;
    
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    if (!nation) {
      await interaction.reply({ content: t('common.not_setup', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    const casesCol = getCollection<LawCase>(Collections.LAW_CASES);
    const caseNumber = `${nation.currency_name.substring(0, 3).toUpperCase()}-WAR-${Date.now().toString().slice(-6)}`;
    
    const newCase: Omit<LawCase, '_id'> = {
      case_number: caseNumber,
      guild_id: guildId,
      type: 'warrant',
      status: 'active',
      subject_discord_id: targetUser.id,
      officer_discord_id: officerId,
      approver_discord_id: null,
      reason,
      amount: null,
      paid_at: null,
      arrested_at: null,
      released_at: null,
      released_by: null,
      distribution_executed: null,
      ledger_entry_id: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await casesCol.insertOne(newCase as any);
    
    await interaction.reply({ 
      content: t('warrant.success', locale, { username: targetUser.username, case_number: caseNumber }) 
    });
  },
};
