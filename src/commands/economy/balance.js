import { SlashCommandBuilder } from 'discord.js';
import { economyRepository } from '../../repositories/economyRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Melihat saldo dompet dan bank virtual Anda atau pengguna lain.')
    .addUserOption((opt) => opt.setName('target').setDescription('Pilih pengguna').setRequired(false)),
  category: 'Economy',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const account = await economyRepository.getOrCreateAccount(interaction.guild.id, targetUser.id);

    const embed = AppEmbed.primary(
      `Saldo Virtual: ${targetUser.tag}`,
      `🪙 **Dompet (Wallet):** \`${account.wallet.toLocaleString()} Koin\`\n` +
      `🏦 **Bank:** \`${account.bank.toLocaleString()} Koin\`\n` +
      `💰 **Total Kekayaan:** \`${(account.wallet + account.bank).toLocaleString()} Koin\``
    ).setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));

    await interaction.reply({ embeds: [embed] });
  },
};
