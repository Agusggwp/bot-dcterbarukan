import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Menampilkan informasi rinci tentang pengguna.')
    .addUserOption((opt) =>
      opt.setName('target').setDescription('Pilih pengguna yang ingin dilihat informasinya').setRequired(false)
    ),
  category: 'Utility',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    const embed = AppEmbed.primary(`Profil: ${targetUser.tag}`, `ID: \`${targetUser.id}\``)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: 'Dibuat Pada', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`, inline: true },
        { name: 'Bot?', value: targetUser.bot ? 'Ya 🤖' : 'Bukan 👤', inline: true }
      );

    if (member) {
      const roles = member.roles.cache
        .filter((r) => r.id !== interaction.guild.id)
        .map((r) => `<@&${r.id}>`)
        .slice(0, 10)
        .join(', ');

      embed.addFields(
        { name: 'Bergabung ke Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'Peran Tertinggi', value: `<@&${member.roles.highest.id}>`, inline: true },
        { name: 'Daftar Peran', value: roles || 'Tidak ada peran khusus', inline: false }
      );
    }

    await interaction.reply({ embeds: [embed] });
  },
};
