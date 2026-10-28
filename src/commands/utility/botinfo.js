import { SlashCommandBuilder, version as djsVersion } from 'discord.js';
import os from 'os';
import { AppEmbed } from '../../utils/embedBuilder.js';
import { formatSecondsToHuman } from '../../utils/timeParser.js';

export default {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Menampilkan statistik sistem dan informasi teknis bot.'),
  category: 'Utility',
  async execute(interaction) {
    const memoryUsedMb = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const uptime = formatSecondsToHuman(Math.floor(process.uptime()));

    const embed = AppEmbed.primary(
      '🤖 Informasi Bot Enterprise',
      'Arsitektur modular berperforma tinggi dengan Discord.js, Prisma ORM, dan PM2 Process Manager.'
    ).addFields(
      { name: 'Node.js', value: `\`${process.version}\``, inline: true },
      { name: 'Discord.js', value: `\`v${djsVersion}\``, inline: true },
      { name: 'Uptime', value: `\`${uptime}\``, inline: true },
      { name: 'Penggunaan Memori', value: `\`${memoryUsedMb} MB\``, inline: true },
      { name: 'OS Platform', value: `\`${os.type()} ${os.arch()}\``, inline: true },
      { name: 'Total Server', value: `\`${interaction.client.guilds.cache.size}\``, inline: true }
    );

    await interaction.reply({ embeds: [embed] });
  },
};
