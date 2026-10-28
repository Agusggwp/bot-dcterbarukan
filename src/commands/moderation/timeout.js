import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderationService.js';
import { parseDurationToSeconds, formatSecondsToHuman } from '../../utils/timeParser.js';
import { LIMITS } from '../../config/constants.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Membungkam (timeout) anggota untuk durasi tertentu.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName('target').setDescription('Anggota target').setRequired(true))
    .addStringOption((opt) =>
      opt.setName('durasi').setDescription('Contoh: 60s, 10m, 2h, 1d (Maks 28 hari)').setRequired(true)
    )
    .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan timeout').setRequired(false)),
  category: 'Moderation',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const durationInput = interaction.options.getString('durasi');
    const reason = interaction.options.getString('alasan') || 'Tidak ada alasan yang diberikan.';

    const seconds = parseDurationToSeconds(durationInput);
    if (!seconds || seconds < LIMITS.TIMEOUT_MIN_SECONDS || seconds > LIMITS.TIMEOUT_MAX_SECONDS) {
      const err = AppEmbed.error(
        'Durasi Tidak Valid',
        'Durasi timeout minimal 5 detik dan maksimal 28 hari (contoh format: `5m`, `1h`, `7d`).'
      );
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      const err = AppEmbed.error('Tidak Ditemukan', 'Pengguna tidak ditemukan di server ini.');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const result = await ModerationService.timeoutMember({
      guild: interaction.guild,
      moderatorMember: interaction.member,
      targetMember,
      durationSeconds: seconds,
      reason,
    });

    if (!result.success) {
      const err = AppEmbed.error('Gagal Memberikan Timeout', result.reason);
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const embed = AppEmbed.warning(
      'Anggota Diberikan Timeout',
      `**Pengguna:** <@${targetUser.id}>\n` +
      `**Durasi:** ${formatSecondsToHuman(seconds)}\n` +
      `**Kasus:** #${result.caseNumber}\n` +
      `**Alasan:** ${reason}`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
