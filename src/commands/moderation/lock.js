import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderationService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Mengunci saluran saat ini agar anggota tidak dapat mengirim pesan.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan penguncian saluran').setRequired(false)),
  category: 'Moderation',
  async execute(interaction) {
    const reason = interaction.options.getString('alasan') || 'Pemeliharaan / Penanganan situasi darurat.';

    const result = await ModerationService.lockChannel({
      channel: interaction.channel,
      moderatorMember: interaction.member,
      reason,
    });

    if (!result.success) {
      const err = AppEmbed.error('Gagal Mengunci Saluran', result.reason);
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const embed = AppEmbed.warning(
      '🔒 Saluran Dikunci',
      `Saluran ini telah dikunci oleh moderator.\n**Alasan:** ${reason}`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
