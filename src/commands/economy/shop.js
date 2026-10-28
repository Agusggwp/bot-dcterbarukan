import { SlashCommandBuilder } from 'discord.js';
import { SHOP_ITEMS } from './shopItems.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Melihat katalog toko barang virtual server.'),
  category: 'Economy',
  async execute(interaction) {
    const list = SHOP_ITEMS.map(
      (item) =>
        `**${item.name}**\n` +
        `• ID: \`${item.id}\`\n` +
        `• Harga: **${item.price.toLocaleString()} Koin**\n` +
        `• Deskripsi: *${item.description}*\n` +
        `• Beli dengan: \`/buy item:${item.id}\``
    ).join('\n\n');

    const embed = AppEmbed.primary('🛒 Toko Barang Virtual', list)
      .setFooter({ text: 'Beli barang menggunakan koin virtual yang didapat dari aktivitas server!' });

    await interaction.reply({ embeds: [embed] });
  },
};
