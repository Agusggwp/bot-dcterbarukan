import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('choose')
    .setDescription('Membantu Anda memilih di antara beberapa opsi.')
    .addStringOption((opt) =>
      opt.setName('pilihan').setDescription('Pisahkan pilihan dengan koma (contoh: Pizza, Burger, Sushi)').setRequired(true)
    ),
  category: 'Utility',
  async execute(interaction) {
    const raw = interaction.options.getString('pilihan');
    const choices = raw.split(',').map((c) => c.trim()).filter((c) => c.length > 0);

    if (choices.length < 2) {
      const err = AppEmbed.error('Pilihan Kurang', 'Masukkan minimal dua pilihan yang dipisahkan dengan koma.');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const picked = choices[Math.floor(Math.random() * choices.length)];
    const embed = AppEmbed.primary(
      'Pilihan Terpilih! 🎯',
      `Dari pilihan yang diberikan, saya memilih:\n\n✨ **${picked}**`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
