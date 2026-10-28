import { SlashCommandBuilder } from 'discord.js';
import { levelRepository } from '../../repositories/levelRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Melihat level, XP, dan peringkat Anda atau anggota lain.')
    .addUserOption((opt) => opt.setName('target').setDescription('Pilih pengguna').setRequired(false)),
  category: 'Leveling',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const rankData = await levelRepository.getUserRank(interaction.guild.id, targetUser.id);

    const embed = AppEmbed.primary(
      `Peringkat Aktivitas: ${targetUser.tag}`,
      `**Level:** \`${rankData.level}\`\n` +
      `**Total XP:** \`${rankData.xp.toLocaleString()} XP\`\n` +
      `**Peringkat:** ${rankData.rank ? `#${rankData.rank}` : 'Belum Terdaftar'}\n` +
      `**Target Level Berikutnya:** \`${rankData.nextLevelXp.toLocaleString()} XP\``
    ).setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));

    await interaction.reply({ embeds: [embed] });
  },
};
