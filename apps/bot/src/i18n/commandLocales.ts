import { Locale } from 'discord.js';

export const commandLocales: Record<string, { nameLocalizations?: Record<string, string>, descriptionLocalizations?: Record<string, string> }> = {
  setup: {
    nameLocalizations: { [Locale.SpanishES]: 'configurar_nacion' },
    descriptionLocalizations: { [Locale.SpanishES]: 'Configura una nueva nación para este servidor de Discord.' }
  },
  perfil: {
    nameLocalizations: { [Locale.EnglishUS]: 'profile' },
    descriptionLocalizations: { [Locale.EnglishUS]: 'View your global and local identity card.' }
  },
  vincular: {
    nameLocalizations: { [Locale.EnglishUS]: 'link' },
    descriptionLocalizations: { [Locale.EnglishUS]: 'Link your Roblox account.' }
  },
  pasaporte: {
    nameLocalizations: { [Locale.EnglishUS]: 'passport' },
    descriptionLocalizations: { [Locale.EnglishUS]: "View a user's passport." }
  },
  dni: {
    descriptionLocalizations: { [Locale.EnglishUS]: 'Generate and view your DNI (National Identity Document).' }
  },
  registro: {
    nameLocalizations: { [Locale.EnglishUS]: 'register' },
    descriptionLocalizations: { [Locale.EnglishUS]: 'Register as a citizen of this nation.' }
  },
  visa: {
    descriptionLocalizations: { [Locale.EnglishUS]: 'Manage visas.' }
  },
  fastpass: {
    descriptionLocalizations: { [Locale.EnglishUS]: 'Grant a border fastpass.' }
  },
  frontera: {
    nameLocalizations: { [Locale.EnglishUS]: 'border' },
    descriptionLocalizations: { [Locale.EnglishUS]: 'Manage border configuration and events.' }
  },
  fine: {
    nameLocalizations: { [Locale.SpanishES]: 'multa' },
    descriptionLocalizations: { [Locale.SpanishES]: 'Emitir una multa a un ciudadano.' }
  },
  arrest: {
    nameLocalizations: { [Locale.SpanishES]: 'arrestar' },
    descriptionLocalizations: { [Locale.SpanishES]: 'Arrestar a un ciudadano.' }
  },
  release: {
    nameLocalizations: { [Locale.SpanishES]: 'liberar' },
    descriptionLocalizations: { [Locale.SpanishES]: 'Liberar a un ciudadano detenido.' }
  },
  warrant: {
    nameLocalizations: { [Locale.SpanishES]: 'orden_busqueda' },
    descriptionLocalizations: { [Locale.SpanishES]: 'Emitir una orden de búsqueda.' }
  },
  bail: {
    nameLocalizations: { [Locale.SpanishES]: 'fianza' },
    descriptionLocalizations: { [Locale.SpanishES]: 'Pagar fianza para salir de prisión.' }
  },
  balance: {
    descriptionLocalizations: { [Locale.SpanishES]: 'Ver tus fondos y cuenta bancaria.' }
  },
  pay: {
    nameLocalizations: { [Locale.SpanishES]: 'pagar' },
    descriptionLocalizations: { [Locale.SpanishES]: 'Transferir dinero a otro usuario o empresa.' }
  },
  empresa: {
    nameLocalizations: { [Locale.EnglishUS]: 'company' },
    descriptionLocalizations: { [Locale.EnglishUS]: 'Manage companies and employment.' }
  },
  trabajo: {
    nameLocalizations: { [Locale.EnglishUS]: 'job' },
    descriptionLocalizations: { [Locale.EnglishUS]: 'Manage jobs and applications.' }
  },
  gobierno: {
    nameLocalizations: { [Locale.EnglishUS]: 'government' },
    descriptionLocalizations: { [Locale.EnglishUS]: 'Government and treasury management.' }
  },
  alianza: {
    nameLocalizations: { [Locale.EnglishUS]: 'alliance' },
    descriptionLocalizations: { [Locale.EnglishUS]: 'Manage diplomatic treaties.' }
  },
  sancion: {
    nameLocalizations: { [Locale.EnglishUS]: 'sanction' },
    descriptionLocalizations: { [Locale.EnglishUS]: 'Issue conduct or lore sanctions.' }
  },
  config: {
    nameLocalizations: { [Locale.SpanishES]: 'configuracion' },
    descriptionLocalizations: { [Locale.SpanishES]: 'Cambiar la configuración de la nación.' }
  },
  help: {
    nameLocalizations: { [Locale.SpanishES]: 'ayuda' },
    descriptionLocalizations: { [Locale.SpanishES]: 'Ver el menú de ayuda de Bloxive.' }
  },
  language: {
    nameLocalizations: { [Locale.SpanishES]: 'idioma' },
    descriptionLocalizations: { [Locale.SpanishES]: 'Cambiar el idioma de respuesta del bot en este servidor.' }
  }
};
