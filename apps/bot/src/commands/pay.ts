import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { ensureCitizen, calculateTax } from '../systems/economy.js';
import { transferMoneyWithTransaction } from '../systems/ledger.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';

export const payCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Transfer money to another citizen')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('Citizen to transfer to')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Amount to transfer')
        .setRequired(true)
        .setMinValue(1))
    .setIntegrationTypes([0]),
    
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);
    const guildId = interaction.guildId!;
    const senderId = interaction.user.id;
    
    const nationCol = getCollection<Nation>(Collections.NATIONS);
    const nation = await nationCol.findOne({ guild_id: guildId });
    const locale = nation?.locale ?? 'es';
    
    if (targetUser.id === senderId) {
      await interaction.reply({ content: t('economy.self_transfer', locale), flags: MessageFlags.Ephemeral });
      return;
    }
    
    try {
      const sender = await ensureCitizen(guildId, senderId);
      const receiver = await ensureCitizen(guildId, targetUser.id);
      
      if (!nation) throw new Error('Nation not found');
      
      if (sender.wallet < amount) {
        const symbol = nation?.currency_symbol ?? '$';
        
        await interaction.reply({ 
          content: t('economy.insufficient_funds', locale, { symbol, balance: sender.wallet, required: amount }), 
          flags: MessageFlags.Ephemeral 
        });
        return;
      }
      
      const taxAmount = calculateTax(amount, nation);
      
      await transferMoneyWithTransaction(
        guildId,
        senderId,
        targetUser.id,
        amount,
        taxAmount,
        nation.currency_name,
        senderId
      );
      
      let replyContent = t('economy.transfer_success', locale, { 
        symbol: nation.currency_symbol, 
        amount, 
        recipient: targetUser.username 
      });
      
      if (taxAmount > 0) {
        replyContent += `\n${t('economy.transfer_tax', locale, {
          symbol: nation.currency_symbol,
          tax: taxAmount,
          percent: nation.config.economy.transaction_tax_pct
        })}`;
      }
      
      await interaction.reply({ content: replyContent });
      
    } catch (err: any) {
      const msg = err.message.includes('not found') ? t('common.not_citizen', locale) : t('common.error', locale);
      await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
    }
  },
};
