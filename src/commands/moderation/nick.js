import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { validateHierarchy } from '../../utils/permissionGuard.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Mengubah nama panggilan (nickname) anggota server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption((opt) => opt.setName('target').setDescription('Anggota yang akan diubah nick-nya').setRequired(true))
    .addStringOption((opt) => opt.setName('nama_baru').setDescription('Nama panggilan baru (kosongkan untuk reset)').setRequired(false)),
  category: 'Moderation',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const newNick = interaction.options.getString('nama_baru') || null;

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      const err = AppEmbed.error('Tidak Ditemukan', 'Pengguna tidak ditemukan di server.');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const hierarchy = validateHierarchy({
      moderatorMember: interaction.member,
      targetMember,
      botMember: interaction.guild.members.me,
    });

    if (!hierarchy.valid) {
      const err = AppEmbed.error('Hirarki Peran', hierarchy.reason);
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    await targetMember.setNickname(newNick, `Diubah oleh moderator: ${interaction.user.tag}`);

    const embed = AppEmbed.success(
      'Nama Panggilan Diperbarui',
      newNick
        ? `Nama panggilan <@${targetUser.id}> berhasil diubah menjadi **${newNick}**.`
        : `Nama panggilan <@${targetUser.id}> berhasil direset ke nama asli.`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
