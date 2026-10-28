import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderationService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Membuka kunci saluran agar anggota dapat kembali berkirim pesan.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan pembukaan kunci').setRequired(false)),
  category: 'Moderation',
  async execute(interaction) {
    const reason = interaction.options.getString('alasan') || 'Situasi telah kondusif.';

    const result = await ModerationService.unlockChannel({
      channel: interaction.channel,
      moderatorMember: interaction.member,
      reason,
    });

    if (!result.success) {
      const err = AppEmbed.error('Gagal Membuka Saluran', result.reason);
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const embed = AppEmbed.success(
      '🔓 Saluran Dibuka Kembali',
      `Saluran ini telah dibuka kembali.\n**Alasan:** ${reason}`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
