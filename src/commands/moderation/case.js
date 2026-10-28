import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { moderationRepository } from '../../repositories/moderationRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('case')
    .setDescription('Melihat rincian kasus moderasi berdasarkan nomor kasus.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addIntegerOption((opt) => opt.setName('nomor').setDescription('Nomor kasus moderasi').setRequired(true)),
  category: 'Moderation',
  async execute(interaction) {
    const caseNumber = interaction.options.getInteger('nomor');
    const modCase = await moderationRepository.getCase(interaction.guild.id, caseNumber);

    if (!modCase) {
      const err = AppEmbed.error('Kasus Tidak Ditemukan', `Kasus nomor #${caseNumber} tidak ditemukan di database.`);
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const embed = AppEmbed.primary(
      `Kasus #${modCase.caseNumber} | Tindakan: ${modCase.action}`,
      `**Target:** <@${modCase.targetId}> (${modCase.targetTag || 'N/A'})\n` +
      `**Moderator:** <@${modCase.moderatorId}> (${modCase.moderatorTag || 'N/A'})\n` +
      `**Waktu:** <t:${Math.floor(modCase.createdAt.getTime() / 1000)}:F>\n` +
      `**Alasan:** ${modCase.reason}`
    );

    if (modCase.duration) {
      embed.addFields({ name: 'Durasi', value: `${modCase.duration} detik`, inline: true });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
