import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getCollection, Collections } from '../lib/db.js';
import type { Nation } from '@bloxive/shared';
import { getGlobalIdentity } from '../systems/identity.js';
import { getPassports } from '../systems/passport.js';

export const passportCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('passport')
    .setDescription('View global passport')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('User to check (optional)')
        .setRequired(false))
    .setIntegrationTypes([0, 1]),
    
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') ?? interaction.user;
    
    const identity = await getGlobalIdentity(interaction.user.id);
    const locale = identity?.preferred_locale ?? 'es';
    
    const targetIdentity = await getGlobalIdentity(targetUser.id);
    if (!targetIdentity) {
      await interaction.reply({ 
        content: t('passport.no_identity', locale),
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    const passports = await getPassports(targetUser.id);
    
    const { EmbedBuilder } = await import('discord.js');
    
    let embed = new EmbedBuilder()
      .setTitle(`🛂 ${t('passport.title', locale, { username: targetUser.username })}`)
      .setColor(0x6C47FF)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: 'PPS (Personal Passport Score)', value: `\`${targetIdentity.pps}/1000\``, inline: true },
        { name: 'Nivel', value: targetIdentity.pps >= 700 ? '✅ Premium' : targetIdentity.pps >= 300 ? '⚠️ Standard' : '❌ Riesgo', inline: true }
      );
      
    let citText = '';
    if (passports.length === 0) {
      citText = t('passport.no_citizenships', locale);
    } else {
      for (const p of passports) {
        citText += `🏛️ Nacion ID: \`${p.issued_by_guild_id}\` | 🎫 \`${p.citizen_number}\`\n`;
      }
    }
    embed.addFields({ name: `**${t('passport.citizenships_title', locale)}**`, value: citText, inline: false });
    
    await interaction.reply({ 
      embeds: [embed],
      flags: MessageFlags.Ephemeral 
    });
  },
};
