import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { moderationRepository } from '../../repositories/moderationRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Menghapus seluruh riwayat peringatan seorang anggota.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) => opt.setName('target').setDescription('Pilih pengguna').setRequired(true)),
  category: 'Moderation',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const result = await moderationRepository.clearUserWarnings(interaction.guild.id, targetUser.id);

    const embed = AppEmbed.success(
      'Peringatan Dihapus',
      `Berhasil menghapus **${result.count}** catatan peringatan untuk <@${targetUser.id}>.`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
