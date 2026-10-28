import { SlashCommandBuilder } from 'discord.js';
import { economyRepository } from '../../repositories/economyRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Melihat tas atau inventaris item virtual Anda.')
    .addUserOption((opt) => opt.setName('target').setDescription('Pilih pengguna').setRequired(false)),
  category: 'Economy',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const account = await economyRepository.getOrCreateAccount(interaction.guild.id, targetUser.id);

    let items = [];
    try {
      items = account.inventory ? JSON.parse(account.inventory) : [];
    } catch {
      items = [];
    }

    if (items.length === 0) {
      const empty = AppEmbed.info(
        `Inventaris: ${targetUser.tag}`,
        'Tas inventaris masih kosong. Gunakan `/shop` dan `/buy` untuk membeli item.'
      );
      return await interaction.reply({ embeds: [empty] });
    }

    const description = items
      .map((item) => `🎒 **${item.name}** (ID: \`${item.id}\`) — Jumlah: \`x${item.quantity || 1}\``)
      .join('\n');

    const embed = AppEmbed.primary(`🎒 Inventaris: ${targetUser.tag}`, description);
    await interaction.reply({ embeds: [embed] });
  },
};
