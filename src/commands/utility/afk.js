import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

// Global AFK Map: userId -> { reason, timestamp }
export const afkUsers = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Mengatur status AFK (Away From Keyboard) Anda.')
    .addStringOption((opt) =>
      opt.setName('alasan').setDescription('Alasan Anda AFK').setRequired(false)
    ),
  category: 'Utility',
  async execute(interaction) {
    const reason = interaction.options.getString('alasan') || 'Sedang sibuk / tidak berada di tempat';

    afkUsers.set(interaction.user.id, {
      reason,
      timestamp: Date.now(),
    });

    const embed = AppEmbed.info(
      'Status AFK Diaktifkan',
      `Anda sekarang berstatus AFK.\n**Alasan:** ${reason}\n\n*Status akan otomatis dihapus saat Anda mengirim pesan kembali.*`
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
