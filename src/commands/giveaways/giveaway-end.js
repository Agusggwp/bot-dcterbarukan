import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { giveawayRepository } from '../../repositories/giveawayRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('giveaway-end')
    .setDescription('Mengakhiri giveaway aktif lebih awal.')
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

    if (giveaway.ended) {
      const err = AppEmbed.warning('Sudah Berakhir', 'Giveaway ini sudah berakhir sebelumnya.');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const result = await giveawayRepository.endGiveaway(giveaway.id);
    const winners = result.winners;

    const channel = await interaction.guild.channels.fetch(giveaway.channelId).catch(() => null);
    if (channel && channel.isTextBased()) {
      const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);

      let winnersText = 'Tidak ada peserta yang berpartisipasi.';
      if (winners && winners.length > 0) {
        winnersText = winners.map((id) => `<@${id}>`).join(', ');
      }

      const endedEmbed = AppEmbed.primary(
        '🎉 GIVEAWAY SELESAI 🎉',
        `**Hadiah:** ${giveaway.prize}\n**Pemenang:** ${winnersText}\n**Dipandu oleh:** <@${giveaway.hostedById}>`
      );

      if (message) {
        await message.edit({ embeds: [endedEmbed], components: [] }).catch(() => null);
      }

      await channel.send({
        content: winners.length > 0 ? `Selamat ${winnersText}! Anda memenangkan **${giveaway.prize}**!` : 'Giveaway berakhir tanpa peserta.',
        embeds: [endedEmbed],
      });
    }

    const reply = AppEmbed.success('Giveaway Diakhiri', `Giveaway untuk **${giveaway.prize}** telah berhasil diakhiri.`);
    await interaction.reply({ embeds: [reply], ephemeral: true });
  },
};
