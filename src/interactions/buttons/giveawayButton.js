import { giveawayRepository } from '../../repositories/giveawayRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export async function handleGiveawayButton(interaction) {
  if (interaction.customId !== 'giveaway_enter') return false;

  const giveaway = await giveawayRepository.getGiveawayByMessageId(interaction.message.id);
  if (!giveaway) {
    const err = AppEmbed.error('Giveaway Tidak Ditemukan', 'Data giveaway ini tidak ditemukan di database.');
    await interaction.reply({ embeds: [err], ephemeral: true });
    return true;
  }

  if (giveaway.ended) {
    const err = AppEmbed.warning('Giveaway Telah Selesai', 'Maaf, giveaway ini sudah berakhir.');
    await interaction.reply({ embeds: [err], ephemeral: true });
    return true;
  }

  // Check required role
  if (giveaway.requiredRoleId && !interaction.member.roles.cache.has(giveaway.requiredRoleId)) {
    const err = AppEmbed.error(
      'Syarat Peran Tidak Terpenuhi',
      `Anda wajib memiliki peran <@&${giveaway.requiredRoleId}> untuk dapat mengikuti giveaway ini.`
    );
    await interaction.reply({ embeds: [err], ephemeral: true });
    return true;
  }

  const result = await giveawayRepository.addEntry(giveaway.id, interaction.user.id);
  if (!result.success && result.reason === 'ALREADY_ENTERED') {
    const info = AppEmbed.info('Sudah Terdaftar', 'Anda sudah berpartisipasi dalam giveaway ini sebelumnya.');
    await interaction.reply({ embeds: [info], ephemeral: true });
    return true;
  }

  const success = AppEmbed.success(
    'Berhasil Terdaftar! 🎉',
    `Nama Anda telah tercatat sebagai peserta untuk memperebutkan **${giveaway.prize}**. Semoga beruntung!`
  );
  await interaction.reply({ embeds: [success], ephemeral: true });
  return true;
}
