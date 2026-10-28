import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('Mengirimkan ide atau saran untuk pengembangan server.')
    .addStringOption((opt) =>
      opt.setName('saran').setDescription('Tulis saran Anda').setRequired(true)
    ),
  category: 'Utility',
  cooldown: 15,
  async execute(interaction) {
    const text = interaction.options.getString('saran');

    const embed = AppEmbed.primary(
      '💡 Saran Baru',
      `**Diajukan oleh:** <@${interaction.user.id}>\n\n> ${text}`
    );

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });
    await message.react('👍').catch(() => null);
    await message.react('👎').catch(() => null);
  },
};
