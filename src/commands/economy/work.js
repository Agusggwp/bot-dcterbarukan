import { SlashCommandBuilder } from 'discord.js';
import { economyRepository } from '../../repositories/economyRepository.js';
import { formatSecondsToHuman } from '../../utils/timeParser.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

const JOBS = [
  'menjadi programmer lepas',
  'mendesain logo untuk startup',
  'memperbaiki bug di server',
  'menjadi barista di kafe',
  'menulis artikel teknologi',
  'mengajar kursus online',
];

export default {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Bekerja untuk mendapatkan koin virtual.'),
  category: 'Economy',
  async execute(interaction) {
    const earned = Math.floor(200 + Math.random() * 300); // 200 - 500
    const job = JOBS[Math.floor(Math.random() * JOBS.length)];

    const result = await economyRepository.work(interaction.guild.id, interaction.user.id, earned);

    if (!result.success) {
      const waitSec = Math.ceil(result.remainingMs / 1000);
      const err = AppEmbed.warning(
        'Sedang Istirahat!',
        `Anda baru saja bekerja. Silakan istirahat dan kembali dalam **${formatSecondsToHuman(waitSec)}**.`
      );
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const embed = AppEmbed.success(
      'Gaji Kerja Diterima! 💼',
      `Anda ${job} dan mendapatkan upah sebesar **${earned.toLocaleString()} Koin**!\nSaldo dompet Anda sekarang: **${result.newBalance.toLocaleString()} Koin**.`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
