import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation, Citizen } from '@bloxive/shared';
import { releaseCitizen } from '../systems/law.js';

export const bailCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('bail')
    .setDescription('Pay your bail to be released')
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
    
    if (!nation.config.law.bail_enabled) {
      await interaction.reply({ content: t('bail.not_enabled', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    const citizensCol = getCollection<Citizen>(Collections.CITIZENS);
    const citizen = await citizensCol.findOne({ guild_id: guildId, discord_id: discordId });
    
    if (!citizen || !citizen.active_arrest) {
      await interaction.reply({ content: t('bail.not_arrested', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    const bailAmount = citizen.bail_amount_owed;
    if (bailAmount <= 0) {
      await interaction.reply({ content: t('bail.not_arrested', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    if (citizen.wallet < bailAmount) {
      await interaction.reply({ 
        content: t('bail.insufficient_funds', locale, { symbol: nation.currency_symbol, amount: bailAmount }),
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    // Deduct bail
    await citizensCol.updateOne(
      { _id: citizen._id },
      { $inc: { wallet: -bailAmount } }
    );
    
    // Auto-release
    await releaseCitizen(guildId, discordId, 'system');
    
    await interaction.reply({ 
      content: t('bail.success', locale, { symbol: nation.currency_symbol, amount: bailAmount })
    });
  },
};
