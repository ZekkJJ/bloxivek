import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation, JobCategory, SalarySource } from '@bloxive/shared';
import { createJob, applyForJob, quitJob, listJobs } from '../systems/jobs.js';

export const jobCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('job')
    .setDescription('Job board and employment')
    .addSubcommand(sub => 
      sub.setName('create')
        .setDescription('Create a new job posting')
        .addStringOption(opt => opt.setName('name').setDescription('Job title').setRequired(true))
        .addStringOption(opt => opt.setName('desc').setDescription('Description').setRequired(true))
        .addIntegerOption(opt => opt.setName('salary').setDescription('Salary amount').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('apply')
        .setDescription('Apply for a job')
        .addStringOption(opt => opt.setName('id').setDescription('Job ID').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('quit')
        .setDescription('Quit your current job')
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List available jobs')
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
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'create') {
      const name = interaction.options.getString('name', true);
      const desc = interaction.options.getString('desc', true);
      const salary = interaction.options.getInteger('salary', true);
      
      // Default to gov job created by admin for now
      // In full version, check if user is company director to link `company_id`
      
      await createJob(guildId, name, desc, salary, 'treasury', 'government', 'open', interaction.user.id);
      
      await interaction.reply({ content: t('job.created', locale, { name }) });
    } else if (subcommand === 'apply') {
      const jobId = interaction.options.getString('id', true);
      
      try {
        await applyForJob(guildId, jobId, interaction.user.id);
        await interaction.reply({ content: t('job.hired', locale), flags: MessageFlags.Ephemeral });
      } catch (err: any) {
        await interaction.reply({ content: t('common.error', locale) + ': ' + err.message, flags: MessageFlags.Ephemeral });
      }
    } else if (subcommand === 'quit') {
      await quitJob(guildId, interaction.user.id);
      await interaction.reply({ content: t('job.quit', locale), flags: MessageFlags.Ephemeral });
    } else if (subcommand === 'list') {
      const jobs = await listJobs(guildId);
      
      if (jobs.length === 0) {
        await interaction.reply({ content: t('job.no_jobs', locale), flags: MessageFlags.Ephemeral });
        return;
      }
      
      let content = `# 📋 ${t('job.board', locale)}\n\n`;
      for (const j of jobs) {
        content += `**${j.name}** (${j.category})\n`;
        content += `ID: \`${j._id.toString()}\`\n`;
        content += `Salary: ${j.salary} ${nation.currency_symbol}\n\n`;
      }
      
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    }
  },
};
