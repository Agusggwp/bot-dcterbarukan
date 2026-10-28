import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('Menampilkan ringkasan statistik detail server.'),
  category: 'Utility',
  async execute(interaction) {
    const { guild } = interaction;
    await guild.channels.fetch();

    const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;

    const embed = AppEmbed.primary(
      `Statistik Detail: ${guild.name}`,
      `ID Server: \`${guild.id}\``
    ).addFields(
      { name: '👥 Total Anggota', value: `${guild.memberCount}`, inline: true },
      { name: '💬 Saluran Teks', value: `${textChannels}`, inline: true },
      { name: '🔊 Saluran Suara', value: `${voiceChannels}`, inline: true },
      { name: '📁 Kategori Saluran', value: `${categories}`, inline: true },
      { name: '🎭 Jumlah Peran', value: `${guild.roles.cache.size}`, inline: true },
      { name: '😀 Total Emoji & Stiker', value: `${guild.emojis.cache.size + guild.stickers.cache.size}`, inline: true }
    );

    await interaction.reply({ embeds: [embed] });
  },
};
