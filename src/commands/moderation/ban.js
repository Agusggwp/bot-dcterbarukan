import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderationService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Memblokir anggota dari server secara permanen.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) => opt.setName('target').setDescription('Pilih pengguna yang akan diban').setRequired(true))
    .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan pemblokiran').setRequired(false))
    .addIntegerOption((opt) =>
      opt
        .setName('hapus_pesan_hari')
        .setDescription('Hapus riwayat pesan (0-7 hari)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),
  category: 'Moderation',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('alasan') || 'Tidak ada alasan yang diberikan.';
    const deleteDays = interaction.options.getInteger('hapus_pesan_hari') || 0;

    const result = await ModerationService.banMember({
      guild: interaction.guild,
      moderatorMember: interaction.member,
      targetUser,
      reason,
      deleteMessageDays: deleteDays,
    });

    if (!result.success) {
      const err = AppEmbed.error('Gagal Memblokir', result.reason);
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const embed = AppEmbed.success(
      'Anggota Berhasil Diblokir (Ban)',
      `**Pengguna:** <@${targetUser.id}> (${targetUser.tag})\n` +
      `**Kasus:** #${result.caseNumber}\n` +
      `**Alasan:** ${reason}`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
