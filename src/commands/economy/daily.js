import { SlashCommandBuilder } from 'discord.js';
import { economyRepository } from '../../repositories/economyRepository.js';
import { formatSecondsToHuman } from '../../utils/timeParser.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Mengklaim hadiah koin harian gratis.'),
  category: 'Economy',
  async execute(interaction) {
    const result = await economyRepository.claimDaily(interaction.guild.id, interaction.user.id, 1000);

    if (!result.success) {
      const waitSec = Math.ceil(result.remainingMs / 1000);
      const err = AppEmbed.warning(
        'Sudah Diklaim!',
        `Anda sudah mengklaim hadiah harian. Silakan kembali dalam **${formatSecondsToHuman(waitSec)}**.`
      );
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const embed = AppEmbed.success(
      'Hadiah Harian Diklaim! 🎁',
      `Anda berhasil menerima **${result.amount.toLocaleString()} Koin**!\nSaldo baru Anda: **${result.newBalance.toLocaleString()} Koin**.`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
