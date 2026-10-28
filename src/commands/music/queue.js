import { SlashCommandBuilder } from 'discord.js';
import { musicService } from '../../services/musicService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Melihat daftar antrean lagu saat ini.'),
  category: 'Music',
  async execute(interaction) {
    const sub = musicService.getSubscription(interaction.guild.id);
    if (!sub || (!sub.currentSong && sub.queue.length === 0)) {
      return await interaction.reply({
        embeds: [AppEmbed.info('Antrean Kosong', 'Saat ini tidak ada musik di dalam antrean pemutaran.')],
        ephemeral: true,
      });
    }

    let description = '';
    if (sub.currentSong) {
      description += `**Sedang Diputar:**\n▶️ [${sub.currentSong.title}](${sub.currentSong.url}) | \`${sub.currentSong.duration}\` (Diminta oleh <@${sub.currentSong.requesterId}>)\n\n`;
    }

    if (sub.queue.length > 0) {
      description += `**Lagu Berikutnya (${sub.queue.length} antrean):**\n`;
      sub.queue.slice(0, 10).forEach((song, idx) => {
        description += `\`${idx + 1}.\` [${song.title}](${song.url}) | \`${song.duration}\`\n`;
      });
      if (sub.queue.length > 10) {
        description += `*...dan ${sub.queue.length - 10} lagu lainnya.*`;
      }
    } else {
      description += '*Tidak ada lagu berikutnya di antrean.*';
    }

    const embed = AppEmbed.primary('📑 Daftar Antrean Musik', description)
      .addFields(
        { name: 'Mode Loop', value: `\`${sub.loopMode.toUpperCase()}\``, inline: true },
        { name: 'Volume', value: `\`${Math.round(sub.volume * 100)}%\``, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
