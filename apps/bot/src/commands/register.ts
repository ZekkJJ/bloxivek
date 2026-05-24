import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation, Citizen } from '@bloxive/shared';
import { getGlobalIdentity } from '../systems/identity.js';
import { issuePassport } from '../systems/passport.js';
import { logImmigrationEvent } from '../systems/immigration.js';

export const registerCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register as a citizen of this nation')
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const discordId = interaction.user.id;
    
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    if (!nation) {
      await interaction.reply({ content: t('common.not_setup', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    if (nation.config.border.mode === 'closed') {
      await interaction.reply({ content: t('registro.border_closed', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
    const existing = await citizensCol.findOne({ guild_id: guildId, discord_id: discordId });
    if (existing) {
      await interaction.reply({ 
        content: t('registro.already_citizen', locale, { citizen_number: existing.citizen_number }),
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    const identity = await getGlobalIdentity(discordId);
    
    const citizenNumber = `${nation.currency_name.substring(0, 3).toUpperCase()}-00${Math.floor(Math.random() * 9000) + 1000}`;
    
    const newCitizen: Omit<Citizen, '_id'> = {
      guild_id: guildId,
      discord_id: discordId,
      citizen_number: citizenNumber,
      status: 'active',
      wallet: 0,
      bank: 0,
      job_id: null,
      company_id: null,
      company_role: null,
      government_role_id: null,
      active_arrest: false,
      bail_amount_owed: 0,
      registered_at: new Date(),
      last_active_at: new Date()
    };
    
    await citizensCol.insertOne(newCitizen as any);
    await issuePassport(discordId, guildId, citizenNumber);
    await logImmigrationEvent(discordId, guildId, 'entry', 'manual', null, 'Registered as citizen');
    
    await interaction.reply({ 
      content: t('registro.success', locale, { nation_name: nation.name, citizen_number: citizenNumber })
    });
  },
};
