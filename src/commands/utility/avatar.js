import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Menampilkan avatar ukuran penuh dari pengguna.')
    .addUserOption((opt) =>
      opt.setName('target').setDescription('Pilih pengguna').setRequired(false)
    ),
  category: 'Utility',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const avatarUrl = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = AppEmbed.primary(`Avatar: ${targetUser.tag}`, `[Unduh Avatar Resolusi Penuh](${avatarUrl})`)
      .setImage(avatarUrl);

    await interaction.reply({ embeds: [embed] });
  },
};
