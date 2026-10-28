import { SlashCommandBuilder } from 'discord.js';
import { musicService } from '../../services/musicService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Mengatur volume pemutaran musik (0 - 100%).')
    .addIntegerOption((opt) =>
      opt
        .setName('tingkat')
        .setDescription('Tingkat volume (0 sampai 100)')
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(true)
    ),
  category: 'Music',
  async execute(interaction) {
    const sub = musicService.getSubscription(interaction.guild.id);
    if (!sub) {
      return await interaction.reply({
        embeds: [AppEmbed.warning('Tidak Ada Musik', 'Bot saat ini tidak sedang memutar musik.')],
        ephemeral: true,
      });
    }

    const vol = interaction.options.getInteger('tingkat');
    sub.setVolume(vol);

    await interaction.reply({
      embeds: [AppEmbed.success('🔊 Volume Diperbarui', `Volume pemutaran disetel ke **${vol}%**.`)]
    });
  },
};
