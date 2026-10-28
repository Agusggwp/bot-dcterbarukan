import { SlashCommandBuilder } from 'discord.js';
import { SHOP_ITEMS } from './shopItems.js';
import { economyRepository } from '../../repositories/economyRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Membeli item dari toko barang virtual server.')
    .addStringOption((opt) => {
      opt.setName('item').setDescription('Pilih item yang ingin dibeli').setRequired(true);
      for (const item of SHOP_ITEMS) {
        opt.addChoices({ name: `${item.name} (${item.price} Koin)`, value: item.id });
      }
      return opt;
    }),
  category: 'Economy',
  async execute(interaction) {
    const itemId = interaction.options.getString('item');
    const selectedItem = SHOP_ITEMS.find((i) => i.id === itemId);

    if (!selectedItem) {
      const err = AppEmbed.error('Item Tidak Ditemukan', 'Item yang dipilih tidak tersedia di toko.');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const result = await economyRepository.buyItem(interaction.guild.id, interaction.user.id, selectedItem);

    if (!result.success) {
      const err = AppEmbed.error(
        'Saldo Tidak Cukup',
        `Harga item ini adalah **${selectedItem.price.toLocaleString()} Koin**, saldo dompet Anda tidak mencukupi.`
      );
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const embed = AppEmbed.success(
      'Pembelian Berhasil! 🎉',
      `Anda telah membeli **${selectedItem.name}** seharga **${selectedItem.price.toLocaleString()} Koin**.\n` +
      `Sisa saldo dompet Anda: **${result.newBalance.toLocaleString()} Koin**.\n\n` +
      `Cek tas Anda menggunakan perintah \`/inventory\`.`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
