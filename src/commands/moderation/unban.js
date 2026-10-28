import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderationService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Membatalkan pemblokiran pengguna berdasarkan User ID.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((opt) => opt.setName('user_id').setDescription('ID Pengguna yang diban').setRequired(true))
    .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan pembatalan ban').setRequired(false)),
  category: 'Moderation',
  async execute(interaction) {
    const userId = interaction.options.getString('user_id');
    const reason = interaction.options.getString('alasan') || 'Tidak ada alasan yang diberikan.';

    const result = await ModerationService.unbanMember({
      guild: interaction.guild,
      moderatorMember: interaction.member,
      targetUserId: userId,
      reason,
    });

    if (!result.success) {
      const err = AppEmbed.error('Gagal Membatalkan Ban', result.reason);
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const embed = AppEmbed.success(
      'Blokir Berhasil Dibatalkan (Unban)',
      `**User ID:** \`${userId}\`\n**Kasus:** #${result.caseNumber}\n**Alasan:** ${reason}`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
