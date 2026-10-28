import { SlashCommandBuilder } from 'discord.js';
import { musicService } from '../../services/musicService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Memutar musik dari YouTube di saluran suara (Voice Channel).')
    .addStringOption((opt) =>
      opt
        .setName('lagu')
        .setDescription('Judul lagu atau tautan YouTube yang ingin diputar')
        .setRequired(true)
    ),
  category: 'Music',
  async execute(interaction) {
    const query = interaction.options.getString('lagu');
    const member = interaction.member;

    if (!member.voice?.channel) {
      return await interaction.reply({
        embeds: [AppEmbed.warning('Saluran Suara Diperlukan', 'Anda harus masuk ke saluran suara (Voice Channel) terlebih dahulu untuk memutar musik.')],
        ephemeral: true,
      });
    }

    try {
      await interaction.deferReply();
    } catch {
      return;
    }

    try {
      const res = await musicService.play(interaction.guild.id, query, member, interaction.channel);

      if (res.status === 'PLAYING') {
        const embed = AppEmbed.success(
          '🎶 Memutar Musik',
          `Sedang memutar: **[${res.track.title}](${res.track.url})**\nDurasi: \`${res.track.duration}\``
        ).setThumbnail(res.track.thumbnail || null);
        await interaction.editReply({ embeds: [embed] }).catch(() => null);
      } else {
        const embed = AppEmbed.info(
          '📥 Dimasukkan ke Antrean',
          `Ditambahkan ke antrean (#${res.position}): **[${res.track.title}](${res.track.url})**\nDurasi: \`${res.track.duration}\``
        ).setThumbnail(res.track.thumbnail || null);
        await interaction.editReply({ embeds: [embed] }).catch(() => null);
      }
    } catch (err) {
      await interaction.editReply({
        embeds: [AppEmbed.error('Gagal Memutar Musik', err.message)],
      }).catch(() => null);
    }
  },
};
