import { EmbedBuilder } from 'discord.js';
import type { GlobalIdentity, Citizen, Nation } from '@bloxive/shared';
import { t } from '../i18n/index.js';

export function buildProfileCard(
  identity: GlobalIdentity,
  locale: 'es' | 'en',
  username: string,
  avatarUrl: string,
  citizen?: Citizen,
  nation?: Nation
) {
  const pps = identity?.pps ?? 500;
  let robloxStatus = t('perfil.not_verified', locale);
  let thumbnail = avatarUrl;
  
  if (identity?.roblox_id) {
    robloxStatus = t('perfil.roblox', locale, { roblox_username: identity.roblox_username ?? 'Unknown' });
    if (identity.roblox_avatar_url) {
      thumbnail = identity.roblox_avatar_url;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0x6C47FF)
    .setAuthor({ name: t('perfil.title', locale, { username }), iconURL: avatarUrl })
    .setThumbnail(thumbnail);

  // Global Section
  let globalText = `**🌐 Global**\n`;
  globalText += `🎮 ${robloxStatus}\n`;
  globalText += `🎫 PPS: **${pps}**\n`;

  if (identity?.platform_sanctions && identity.platform_sanctions.length > 0) {
    globalText += `\n🚨 **${t('perfil.sanctions', locale)}**: ${identity.platform_sanctions.length}\n`;
  }

  // Local Section (if citizen exists)
  let localText = `\n**🏛️ ${nation ? nation.name : 'Local'}**\n`;
  if (citizen && nation) {
    localText += `🛂 ${t('perfil.citizen_id', locale)}: **${citizen.citizen_number}**\n`;
    
    const symbol = nation.currency_symbol || '$';
    localText += `💰 ${t('balance.wallet', locale, { symbol, amount: citizen.wallet })}\n`;
    
    if (nation.config.economy.wallet_bank_split) {
      localText += `🏦 ${t('balance.bank', locale, { symbol, amount: citizen.bank })}\n`;
    }

    if (citizen.company_role) {
      localText += `🏢 ${t('perfil.company_role', locale, { role: citizen.company_role })}\n`;
    }

    if (citizen.active_arrest) {
      localText += `\n🚨 **${t('perfil.active_arrest', locale)}**\n`;
    }
    
    if (citizen.bail_amount_owed > 0) {
      localText += `⚠️ ${t('balance.pending_fines', locale, { symbol, amount: citizen.bail_amount_owed })}\n`;
    }
  } else {
    localText += `*${t('perfil.not_citizen', locale)}*\n`;
  }

  embed.setDescription(globalText + localText);

  return embed;
}
