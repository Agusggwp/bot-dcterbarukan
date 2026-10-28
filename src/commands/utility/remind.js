import { SlashCommandBuilder } from 'discord.js';
import { reminderRepository } from '../../repositories/reminderRepository.js';
import { parseDurationToSeconds, formatSecondsToHuman } from '../../utils/timeParser.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Mengatur pengingat otomatis untuk Anda.')
    .addStringOption((opt) =>
      opt.setName('durasi').setDescription('Contoh: 10m, 2h, 1d (m=menit, h=jam, d=hari)').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('pesan').setDescription('Pesan atau catatan pengingat').setRequired(true)
    ),
  category: 'Utility',
  async execute(interaction) {
    const durationInput = interaction.options.getString('durasi');
    const message = interaction.options.getString('pesan');

    const durationSeconds = parseDurationToSeconds(durationInput);
    if (!durationSeconds || durationSeconds < 10 || durationSeconds > 30 * 86400) {
      const errEmbed = AppEmbed.error(
        'Format Durasi Tidak Valid',
        'Gunakan format seperti `10m` (10 menit), `2h` (2 jam), atau `1d` (1 hari). Minimal 10 detik, maksimal 30 hari.'
      );
      return await interaction.reply({ embeds: [errEmbed], ephemeral: true });
    }

    const dueAt = new Date(Date.now() + durationSeconds * 1000);

    await reminderRepository.createReminder({
      userId: interaction.user.id,
      channelId: interaction.channel.id,
      guildId: interaction.guild?.id || null,
      reminderText: message,
      dueAt,
    });

    const embed = AppEmbed.success(
      'Pengingat Disimpan!',
      `Bot akan mengingatkan Anda dalam **${formatSecondsToHuman(durationSeconds)}** (<t:${Math.floor(dueAt.getTime() / 1000)}:R>).\n\n` +
      `**Catatan:** ${message}`
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
