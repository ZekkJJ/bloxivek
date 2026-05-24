import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation, Company } from '@bloxive/shared';
import { createCompany, dissolveCompany } from '../systems/company.js';
import { ObjectId } from 'mongodb';

export const companyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('company')
    .setDescription('Company management')
    .addSubcommand(sub => 
      sub.setName('create')
        .setDescription('Create a new company')
        .addStringOption(opt => opt.setName('name').setDescription('Company name').setRequired(true))
        .addStringOption(opt => opt.setName('type').setDescription('Company industry/type').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('dissolve')
        .setDescription('Dissolve your company')
        .addStringOption(opt => opt.setName('id').setDescription('Company ID').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('View company info')
        .addStringOption(opt => opt.setName('id').setDescription('Company ID').setRequired(true))
    )
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    if (!nation) {
      await interaction.reply({ content: t('common.not_setup', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    if (!nation.config.features.companies_enabled) {
      await interaction.reply({ content: t('company.disabled', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'create') {
      const name = interaction.options.getString('name', true);
      const type = interaction.options.getString('type', true);
      
      try {
        const company = await createCompany(guildId, interaction.user.id, name, type, nation);
        
        let content = t('company.created', locale, { name: company.name });
        if (company.status === 'pending') {
          content += '\n' + t('company.pending_approval', locale);
        }
        await interaction.reply({ content });
      } catch (err: any) {
        let msg = t('common.error', locale);
        if (err.message === 'Not a citizen') msg = t('common.target_not_citizen', locale, { username: interaction.user.username });
        if (err.message === 'Insufficient funds for fee') msg = t('company.insufficient_funds', locale, { fee: nation.config.economy.company_creation_fee });
        
        await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
      }
    } else if (subcommand === 'dissolve') {
      const id = interaction.options.getString('id', true);
      const compCol = getCollection<Company>(Collections.COMPANIES);
      const comp = await compCol.findOne({ _id: new ObjectId(id), guild_id: guildId });
      
      if (!comp || comp.owner_discord_id !== interaction.user.id) {
        await interaction.reply({ content: t('company.not_owner', locale), flags: MessageFlags.Ephemeral });
        return;
      }
      
      await dissolveCompany(guildId, id);
      await interaction.reply({ content: t('company.dissolved', locale, { name: comp.name }) });
    } else if (subcommand === 'info') {
      const id = interaction.options.getString('id', true);
      const compCol = getCollection<Company>(Collections.COMPANIES);
      const comp = await compCol.findOne({ _id: new ObjectId(id), guild_id: guildId });
      
      if (!comp) {
        await interaction.reply({ content: t('company.not_found', locale), flags: MessageFlags.Ephemeral });
        return;
      }
      
      let content = `# 🏢 ${comp.name}\n`;
      content += `**Type:** ${comp.type}\n`;
      content += `**Status:** ${comp.status.toUpperCase()}\n`;
      content += `**Employees:** ${comp.current_employee_count} / ${comp.max_employees}\n`;
      
      // If owner or authorized, show wallet
      if (comp.owner_discord_id === interaction.user.id) {
        content += `**Wallet:** ${comp.wallet} ${nation.currency_symbol}\n`;
      }
      
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    }
  },
};
