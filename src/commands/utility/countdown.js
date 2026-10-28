import { SlashCommandBuilder } from 'discord.js';
import { parseDurationToSeconds } from '../../utils/timeParser.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('countdown')
    .setDescription('Membuat hitung mundur waktu dinamis (Discord dynamic timestamp).')
    .addStringOption((opt) =>
      opt.setName('durasi').setDescription('Contoh: 10m, 1h, 30s').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('acara').setDescription('Nama acara atau agenda').setRequired(false)
    ),
  category: 'Utility',
  async execute(interaction) {
    const durationInput = interaction.options.getString('durasi');
    const eventName = interaction.options.getString('acara') || 'Waktu Habis';

    const seconds = parseDurationToSeconds(durationInput);
    if (!seconds) {
      const err = AppEmbed.error('Format Tidak Valid', 'Gunakan format durasi yang benar, misalnya `15m` atau `2h`.');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const targetTime = Math.floor((Date.now() + seconds * 1000) / 1000);

    const embed = AppEmbed.primary(
      `⏳ Hitung Mundur: ${eventName}`,
      `Waktu target: <t:${targetTime}:F>\nBerakhir: <t:${targetTime}:R>`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
