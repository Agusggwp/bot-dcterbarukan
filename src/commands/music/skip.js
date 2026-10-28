import { SlashCommandBuilder } from 'discord.js';
import { musicService } from '../../services/musicService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Melewati lagu yang sedang diputar ke lagu berikutnya di antrean.'),
  category: 'Music',
  async execute(interaction) {
    const sub = musicService.getSubscription(interaction.guild.id);
    if (!sub || !sub.currentSong) {
      return await interaction.reply({
        embeds: [AppEmbed.warning('Tidak Ada Musik', 'Saat ini tidak ada musik yang sedang diputar.')],
        ephemeral: true,
      });
    }

    if (!interaction.member.voice?.channel || interaction.member.voice.channel.id !== sub.voiceChannel.id) {
      return await interaction.reply({
        embeds: [AppEmbed.warning('Saluran Berbeda', 'Anda harus berada di saluran suara yang sama dengan bot untuk melewati lagu.')],
        ephemeral: true,
      });
    }

    const skippedTitle = sub.currentSong.title;
    sub.skip();

    await interaction.reply({
      embeds: [AppEmbed.info('⏭️ Lagu Dilewati', `Lagu **${skippedTitle}** telah dilewati.`)],
    });
  },
};
