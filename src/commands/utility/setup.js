import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { guildRepository } from '../../repositories/guildRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Konfigurasi awal server (ModLog, Peran Staf, Welcome Channel).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((opt) =>
      opt
        .setName('modlog_channel')
        .setDescription('Saluran untuk audit dan riwayat moderasi')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addRoleOption((opt) =>
      opt.setName('mod_role').setDescription('Peran untuk tim moderator').setRequired(false)
    )
    .addRoleOption((opt) =>
      opt.setName('admin_role').setDescription('Peran untuk tim administrator').setRequired(false)
    )
    .addChannelOption((opt) =>
      opt
        .setName('welcome_channel')
        .setDescription('Saluran sambutan anggota baru')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addRoleOption((opt) =>
      opt.setName('auto_role').setDescription('Peran otomatis saat anggota baru bergabung').setRequired(false)
    )
    .addChannelOption((opt) =>
      opt
        .setName('trap_channel')
        .setDescription('Saluran perangkap anti-spam hack (siapa pun yang mengetik langsung di-kick)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  category: 'Utility',
  async execute(interaction) {
    const modLogChannel = interaction.options.getChannel('modlog_channel');
    const modRole = interaction.options.getRole('mod_role');
    const adminRole = interaction.options.getRole('admin_role');
    const welcomeChannel = interaction.options.getChannel('welcome_channel');
    const autoRole = interaction.options.getRole('auto_role');
    const trapChannel = interaction.options.getChannel('trap_channel');

    const updateData = {};
    if (modLogChannel) updateData.modLogChannelId = modLogChannel.id;
    if (modRole) updateData.modRoleId = modRole.id;
    if (adminRole) updateData.adminRoleId = adminRole.id;
    if (trapChannel) {
      updateData.antiSpamTrapEnabled = true;
      updateData.antiSpamTrapChannelId = trapChannel.id;
    }

    if (Object.keys(updateData).length > 0) {
      await guildRepository.updateGuildConfig(interaction.guild.id, updateData);
    }

    const welcomeUpdate = {};
    if (welcomeChannel) {
      welcomeUpdate.enabled = true;
      welcomeUpdate.channelId = welcomeChannel.id;
    }
    if (autoRole) {
      welcomeUpdate.autoRoleId = autoRole.id;
    }

    if (Object.keys(welcomeUpdate).length > 0) {
      await guildRepository.updateWelcomeConfig(interaction.guild.id, welcomeUpdate);
    }

    const embed = AppEmbed.success(
      'Konfigurasi Berhasil Diperbarui',
      'Pengaturan server telah disimpan ke database:\n\n' +
      `• **Saluran ModLog:** ${modLogChannel ? `<#${modLogChannel.id}>` : '*(Tidak diubah)*'}\n` +
      `• **Peran Moderator:** ${modRole ? `<@&${modRole.id}>` : '*(Tidak diubah)*'}\n` +
      `• **Peran Administrator:** ${adminRole ? `<@&${adminRole.id}>` : '*(Tidak diubah)*'}\n` +
      `• **Saluran Sambutan:** ${welcomeChannel ? `<#${welcomeChannel.id}>` : '*(Tidak diubah)*'}\n` +
      `• **Auto Role:** ${autoRole ? `<@&${autoRole.id}>` : '*(Tidak diubah)*'}\n` +
      `• **Saluran Perangkap (Trap):** ${trapChannel ? `<#${trapChannel.id}> (Langsung Kick)` : '*(Tidak diubah)*'}`
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
