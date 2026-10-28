import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Menampilkan daftar perintah dan dokumentasi bot.')
    .addStringOption((opt) =>
      opt
        .setName('kategori')
        .setDescription('Pilih kategori perintah tertentu')
        .setRequired(false)
        .addChoices(
          { name: 'Utility & Umum', value: 'Utility' },
          { name: 'Moderasi & Keamanan', value: 'Moderation' },
          { name: 'Tiket Bantuan', value: 'Tickets' },
          { name: 'Leveling & XP', value: 'Leveling' },
          { name: 'Ekonomi Virtual', value: 'Economy' },
          { name: 'Giveaways', value: 'Giveaways' }
        )
    ),
  category: 'Utility',
  cooldown: 5,
  async execute(interaction) {
    const selectedCategory = interaction.options.getString('kategori');
    const { commands } = interaction.client;

    if (selectedCategory) {
      const filtered = commands.filter((cmd) => cmd.category === selectedCategory);
      const list = filtered
        .map((cmd) => `\`/${cmd.data.name}\` — ${cmd.data.description}`)
        .join('\n');

      const embed = AppEmbed.primary(
        `Kategori: ${selectedCategory}`,
        list || 'Tidak ada perintah yang ditemukan dalam kategori ini.'
      );
      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Overview
    const categories = [...new Set(commands.map((c) => c.category || 'General'))];
    const embed = AppEmbed.primary(
      '📚 Panduan Perintah Bot',
      'Berikut adalah ringkasan kategori perintah yang tersedia. Gunakan `/help kategori:<nama>` untuk melihat rincian per kategori.'
    );

    for (const cat of categories) {
      const count = commands.filter((c) => (c.category || 'General') === cat).size;
      embed.addFields({
        name: `📂 ${cat}`,
        value: `${count} Perintah`,
        inline: true,
      });
    }

    embed.setFooter({ text: 'Discord Bot Enterprise Edition • 24/7 PM2 Ubuntu' });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
