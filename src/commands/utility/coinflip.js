import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Melempar koin (Gambar atau Angka).'),
  category: 'Utility',
  async execute(interaction) {
    const outcome = Math.random() < 0.5 ? 'Gambar' : 'Angka';
    const emoji = outcome === 'Gambar' ? '🪙' : '🪙';

    const embed = AppEmbed.primary('Lempar Koin', `${emoji} Koin mendarat pada: **${outcome}**!`);
    await interaction.reply({ embeds: [embed] });
  },
};
