import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { moderationRepository } from '../../repositories/moderationRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('modlogs')
    .setDescription('Melihat riwayat kasus tindakan moderasi seorang anggota.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName('target').setDescription('Pilih pengguna').setRequired(true)),
  category: 'Moderation',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const cases = await moderationRepository.getUserCases(interaction.guild.id, targetUser.id, 10);

    if (cases.length === 0) {
      const clean = AppEmbed.success('Tidak Ada Catatan', `Tidak ada riwayat tindakan moderasi untuk <@${targetUser.id}>.`);
      return await interaction.reply({ embeds: [clean], ephemeral: true });
    }

    const description = cases
      .map(
        (c) =>
          `**Kasus #${c.caseNumber} [${c.action}]** • <t:${Math.floor(c.createdAt.getTime() / 1000)}:d>\n` +
          `**Moderator:** <@${c.moderatorId}>\n` +
          `**Alasan:** ${c.reason}`
      )
      .join('\n\n');

    const embed = AppEmbed.primary(
      `Riwayat Moderasi: ${targetUser.tag}`,
      description
    );

    await interaction.reply({ embeds: [embed] });
  },
};
