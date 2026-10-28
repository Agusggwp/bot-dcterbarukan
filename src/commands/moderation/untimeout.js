import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderationService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Membatalkan status timeout pada anggota.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName('target').setDescription('Anggota target').setRequired(true))
    .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan pembatalan').setRequired(false)),
  category: 'Moderation',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('alasan') || 'Tidak ada alasan yang diberikan.';

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      const err = AppEmbed.error('Tidak Ditemukan', 'Pengguna tidak ditemukan di server ini.');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const result = await ModerationService.untimeoutMember({
      guild: interaction.guild,
      moderatorMember: interaction.member,
      targetMember,
      reason,
    });

    if (!result.success) {
      const err = AppEmbed.error('Gagal Membatalkan Timeout', result.reason);
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const embed = AppEmbed.success(
      'Timeout Berhasil Dibatalkan',
      `**Pengguna:** <@${targetUser.id}>\n**Kasus:** #${result.caseNumber}\n**Alasan:** ${reason}`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
