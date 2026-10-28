import { SlashCommandBuilder } from 'discord.js';
import { levelRepository } from '../../repositories/levelRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Menampilkan papan peringkat (leaderboard) XP dan Level server.')
    .addIntegerOption((opt) =>
      opt.setName('halaman').setDescription('Nomor halaman papan peringkat').setMinValue(1).setRequired(false)
    ),
  category: 'Leveling',
  async execute(interaction) {
    const page = interaction.options.getInteger('halaman') || 1;
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const { users, totalCount } = await levelRepository.getLeaderboard(interaction.guild.id, pageSize, skip);

    if (users.length === 0) {
      const empty = AppEmbed.info('Papan Peringkat', 'Belum ada data aktivitas XP di halaman ini.');
      return await interaction.reply({ embeds: [empty], ephemeral: true });
    }

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const list = users
      .map((u, i) => {
        const pos = skip + i + 1;
        const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `**#${pos}**`;
        return `${medal} <@${u.userId}> — **Level ${u.level}** (${u.xp.toLocaleString()} XP)`;
      })
      .join('\n\n');

    const embed = AppEmbed.primary(
      `🏆 Papan Peringkat Server: ${interaction.guild.name}`,
      list
    ).setFooter({ text: `Halaman ${page} dari ${totalPages} • Total Anggota Aktif: ${totalCount}` });

    await interaction.reply({ embeds: [embed] });
  },
};
