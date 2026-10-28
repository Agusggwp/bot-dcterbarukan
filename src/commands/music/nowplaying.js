import { SlashCommandBuilder } from 'discord.js';
import { musicService } from '../../services/musicService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Menampilkan informasi lengkap lagu yang sedang diputar saat ini.'),
  category: 'Music',
  async execute(interaction) {
    const sub = musicService.getSubscription(interaction.guild.id);
    if (!sub || !sub.currentSong) {
      return await interaction.reply({
        embeds: [AppEmbed.info('Tidak Ada Musik', 'Saat ini tidak ada musik yang sedang diputar.')],
        ephemeral: true,
      });
    }

    const song = sub.currentSong;
    const embed = AppEmbed.primary('🎵 Sedang Diputar Saat Ini', `**[${song.title}](${song.url})**`)
      .addFields(
        { name: 'Durasi', value: `\`${song.duration}\``, inline: true },
        { name: 'Diminta oleh', value: `<@${song.requesterId}>`, inline: true },
        { name: 'Status', value: sub.player.state.status === 'paused' ? '⏸️ Dijeda' : '▶️ Memutar', inline: true },
        { name: 'Volume', value: `\`${Math.round(sub.volume * 100)}%\``, inline: true },
        { name: 'Mode Loop', value: `\`${sub.loopMode.toUpperCase()}\``, inline: true },
        { name: 'Sisa Antrean', value: `\`${sub.queue.length} lagu\``, inline: true }
      )
      .setThumbnail(song.thumbnail || null);

    await interaction.reply({ embeds: [embed] });
  },
};
