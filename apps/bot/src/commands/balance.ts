import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCitizen } from '../systems/economy.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';
import { getGlobalIdentity } from '../systems/identity.js';
import { bloxiveContainer, errorContainer } from '../builders/containers.js';

export const balanceCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription("Check your balance or another citizen's balance")
    .addUserOption(option => 
      option.setName('user')
        .setDescription('User to check (optional)')
        .setRequired(false))
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') ?? interaction.user;
    const guildId = interaction.guildId!;
    
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    const citizen = await getCitizen(guildId, targetUser.id);
    if (!citizen) {
      await interaction.reply({
        embeds: [errorContainer(t('common.target_not_citizen', locale, { username: targetUser.username }))],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    
    const symbol = nation?.currency_symbol ?? '$';
    const total = citizen.wallet + citizen.bank;
    
    let content = `**${t('balance.wallet', locale, { symbol, amount: citizen.wallet })}**\n`;
    
    if (nation?.config.economy.wallet_bank_split) {
      content += `**${t('balance.bank', locale, { symbol, amount: citizen.bank })}**\n`;
      content += `**${t('balance.total', locale, { symbol, amount: total })}**\n`;
    }
    
    if (citizen.bail_amount_owed > 0) {
      content += `\n⚠️ ${t('balance.pending_fines', locale, { symbol, amount: citizen.bail_amount_owed })}`;
    }
    
    const embed = bloxiveContainer(content)
      .setTitle(`🏦 ${t('balance.title', locale, { username: targetUser.username })}`)
      .setThumbnail(targetUser.displayAvatarURL());
      
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};
