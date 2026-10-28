import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderationService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Mengeluarkan anggota dari server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((opt) => opt.setName('target').setDescription('Anggota yang akan dikeluarkan').setRequired(true))
    .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan kick').setRequired(false)),
  category: 'Moderation',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('alasan') || 'Tidak ada alasan yang diberikan.';

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      const err = AppEmbed.error('Tidak Ditemukan', 'Pengguna tidak ditemukan di server ini.');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const result = await ModerationService.kickMember({
      guild: interaction.guild,
      moderatorMember: interaction.member,
      targetMember,
      reason,
    });

    if (!result.success) {
      const err = AppEmbed.error('Gagal Mengeluarkan Anggota', result.reason);
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const embed = AppEmbed.warning(
      'Anggota Dikeluarkan (Kick)',
      `**Pengguna:** <@${targetUser.id}> (${targetUser.tag})\n**Kasus:** #${result.caseNumber}\n**Alasan:** ${reason}`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
