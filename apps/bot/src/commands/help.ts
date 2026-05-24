import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../types/discord.js';
import { t } from '../i18n/index.js';
import { getGlobalIdentity } from '../systems/identity.js';

export const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help about Bloxive commands')
    .setIntegrationTypes([0, 1]),
    
  async execute(interaction) {
    const { EmbedBuilder } = await import('discord.js');
    const identity = await getGlobalIdentity(interaction.user.id);
    const locale = identity?.preferred_locale ?? 'es';

    const embed = new EmbedBuilder()
      .setTitle(`🏛️ ${t('help.title', locale)}`)
      .setDescription(t('help.description', locale))
      .setColor(0x6C47FF)
      .addFields(
        { 
          name: `🌐 ${t('help.category_general', locale)}`, 
          value: '`/profile` - Ver perfil global y local\n`/link` - Vincular cuenta de Roblox\n`/register` - Registrarse en la nación actual\n`/passport` - Ver pasaporte global',
          inline: false
        },
        { 
          name: `💰 ${t('help.category_economy', locale)}`, 
          value: '`/balance` - Ver fondos\n`/pay` - Transferir dinero\n`/company` - Gestionar empresas\n`/job` - Ofertas de empleo',
          inline: false
        },
        { 
          name: `⚖️ ${t('help.category_law', locale)}`, 
          value: '`/fine` - Multar ciudadano\n`/arrest` - Arrestar ciudadano\n`/release` - Liberar ciudadano\n`/bail` - Pagar fianza\n`/warrant` - Orden de captura',
          inline: false
        },
        {
          name: `🛂 Fronteras y Diplomacia`,
          value: '`/visa` - Gestionar visas\n`/fastpass` - Emitir fastpass\n`/border` - Control fronterizo\n`/alliance` - Alianzas diplomáticas',
          inline: false
        },
        { 
          name: `⚙️ ${t('help.category_admin', locale)}`, 
          value: '`/setup` - Configurar nación\n`/config` - Cambiar configuración\n`/government` - Empleos públicos\n`/sanction` - Emitir sanciones\n`/dni` - Editor DNI',
          inline: false
        }
      )
      .setFooter({ text: 'Bloxive V3 Motor de Gobernanza' })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};
