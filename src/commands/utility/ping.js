import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Memeriksa latensi bot dan Discord Gateway API.'),
  category: 'Utility',
  cooldown: 5,
  async execute(interaction) {
    const sent = await interaction.reply({
      content: '🏓 Mengukur latensi...',
      fetchReply: true,
      ephemeral: true,
    });

    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = interaction.client.ws.ping;

    const embed = AppEmbed.primary(
      'Pong! 🏓',
      `**Latensi Bot:** \`${roundtrip}ms\`\n**Latensi WebSocket Discord:** \`${wsPing}ms\``
    );

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
