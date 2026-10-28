import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { moderationRepository } from '../../repositories/moderationRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Melihat daftar riwayat peringatan seorang anggota.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName('target').setDescription('Pilih pengguna').setRequired(true)),
  category: 'Moderation',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const warnings = await moderationRepository.getUserWarnings(interaction.guild.id, targetUser.id);

    if (warnings.length === 0) {
      const cleanEmbed = AppEmbed.success(
        'Catatan Bersih',
        `<@${targetUser.id}> tidak memiliki riwayat peringatan di server ini.`
      );
      return await interaction.reply({ embeds: [cleanEmbed], ephemeral: true });
    }

    const description = warnings
      .map(
        (w, i) =>
          `**#${i + 1}** • <t:${Math.floor(w.createdAt.getTime() / 1000)}:d>\n` +
          `**Moderator:** <@${w.moderatorId}>\n` +
          `**Alasan:** ${w.reason}`
      )
      .join('\n\n');

    const embed = AppEmbed.warning(
      `Riwayat Peringatan: ${targetUser.tag} (${warnings.length})`,
      description
    );

    await interaction.reply({ embeds: [embed] });
  },
};
