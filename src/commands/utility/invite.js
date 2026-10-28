import { SlashCommandBuilder, OAuth2Scopes, PermissionFlagsBits } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Mendapatkan link undangan resmi untuk menambahkan bot ke server Anda.'),
  category: 'Utility',
  async execute(interaction) {
    const inviteUrl = interaction.client.generateInvite({
      scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
      permissions: [
        PermissionFlagsBits.Administrator,
        PermissionFlagsBits.ManageGuild,
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.BanMembers,
        PermissionFlagsBits.ModerateMembers,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });

    const embed = AppEmbed.primary(
      'Undang Bot ke Server Anda',
      `Klik tautan di bawah ini untuk mengundang bot dengan izin yang disarankan:\n\n🔗 **[Undang Bot Sekarang](${inviteUrl})**`
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
