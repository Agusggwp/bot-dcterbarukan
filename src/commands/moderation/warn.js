import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderationService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Memberikan peringatan resmi kepada anggota.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName('target').setDescription('Anggota yang diperingatkan').setRequired(true))
    .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan peringatan').setRequired(true)),
  category: 'Moderation',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('alasan');

    const result = await ModerationService.warnMember({
      guild: interaction.guild,
      moderatorMember: interaction.member,
      targetUser,
      reason,
    });

    if (!result.success) {
      const err = AppEmbed.error('Gagal Memberikan Peringatan', result.reason);
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const embed = AppEmbed.warning(
      'Peringatan Resmi Diberikan',
      `**Pengguna:** <@${targetUser.id}> (${targetUser.tag})\n` +
      `**Kasus:** #${result.caseNumber}\n` +
      `**Alasan:** ${reason}`
    );

    // Try to notify user in DM safely
    await targetUser.send({
      embeds: [AppEmbed.warning(`Peringatan dari ${interaction.guild.name}`, `Anda telah diperingatkan oleh staf:\n\n**Alasan:** ${reason}`)],
    }).catch(() => null);

    await interaction.reply({ embeds: [embed] });
  },
};
