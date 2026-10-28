import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { giveawayRepository } from '../../repositories/giveawayRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('giveaway-reroll')
    .setDescription('Mengundi ulang pemenang giveaway yang telah selesai.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) => opt.setName('message_id').setDescription('Message ID pesan giveaway').setRequired(true)),
  category: 'Giveaways',
  async execute(interaction) {
    const messageId = interaction.options.getString('message_id');
    const giveaway = await giveawayRepository.getGiveawayByMessageId(messageId);

    if (!giveaway || giveaway.guildId !== interaction.guild.id) {
      const err = AppEmbed.error('Tidak Ditemukan', 'Giveaway dengan Message ID tersebut tidak ditemukan di server ini.');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    if (!giveaway.ended) {
      const err = AppEmbed.warning('Belum Berakhir', 'Giveaway masih berjalan. Gunakan `/giveaway-end` jika ingin mengakhirinya sekarang.');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const result = await giveawayRepository.rerollGiveaway(giveaway.id);
    const newWinners = result.winners;

    if (!newWinners || newWinners.length === 0) {
      const err = AppEmbed.warning('Tidak Ada Entri', 'Tidak ada peserta yang memenuhi syarat untuk diundi ulang.');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const winnersText = newWinners.map((id) => `<@${id}>`).join(', ');
    const channel = await interaction.guild.channels.fetch(giveaway.channelId).catch(() => null);

    if (channel && channel.isTextBased()) {
      const embed = AppEmbed.success(
        '🎉 PENGUNDIAN ULANG GIVEAWAY 🎉',
        `Pemenang baru untuk **${giveaway.prize}** adalah: ${winnersText}!\nSelamat! 🎊`
      );
      await channel.send({ content: winnersText, embeds: [embed] });
    }

    const reply = AppEmbed.success('Reroll Berhasil', `Pemenang baru telah dipilih: ${winnersText}`);
    await interaction.reply({ embeds: [reply], ephemeral: true });
  },
};
