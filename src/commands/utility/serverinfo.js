import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Menampilkan rincian informasi dan statistik server ini.'),
  category: 'Utility',
  async execute(interaction) {
    const { guild } = interaction;
    await guild.members.fetch(); // Ensure cache is populated for stats

    const totalMembers = guild.memberCount;
    const botCount = guild.members.cache.filter((m) => m.user.bot).size;
    const humanCount = totalMembers - botCount;
    const channelCount = guild.channels.cache.size;
    const roleCount = guild.roles.cache.size;

    const embed = AppEmbed.primary(
      `🏛️ Informasi Server: ${guild.name}`,
      `ID: \`${guild.id}\`\nDibuat pada: <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`
    )
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: 'Pemilik Server', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Total Anggota', value: `👥 ${totalMembers} (${humanCount} Orang, ${botCount} Bot)`, inline: true },
        { name: 'Tingkat Verifikasi', value: `${guild.verificationLevel}`, inline: true },
        { name: 'Total Saluran', value: `💬 ${channelCount}`, inline: true },
        { name: 'Total Peran', value: `🎭 ${roleCount}`, inline: true },
        { name: 'Boost Level', value: `🚀 Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} Boosts)`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
