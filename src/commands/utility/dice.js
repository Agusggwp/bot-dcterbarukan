import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Melempar dadu (D6 atau jumlah sisi pilihan).')
    .addIntegerOption((opt) =>
      opt.setName('sisi').setDescription('Jumlah sisi dadu (standar: 6)').setMinValue(2).setMaxValue(100).setRequired(false)
    ),
  category: 'Utility',
  async execute(interaction) {
    const sides = interaction.options.getInteger('sisi') || 6;
    const roll = Math.floor(Math.random() * sides) + 1;

    const embed = AppEmbed.primary('Lempar Dadu 🎲', `Dadu D${sides} bergulir dan menghasilkan angka: **${roll}**!`);
    await interaction.reply({ embeds: [embed] });
  },
};
