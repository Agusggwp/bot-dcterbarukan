import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { guildRepository } from '../../repositories/guildRepository.js';
import { WelcomeService } from '../../services/welcomeService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-welcome')
    .setDescription('Menguji coba pengiriman pesan sambutan (welcome) ke saluran yang dikonfigurasi.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  category: 'Utility',
  async execute(interaction) {
    const config = await guildRepository.getGuildConfig(interaction.guild.id);
    const welcome = config.welcomeConfig;

    if (!welcome || !welcome.channelId) {
      const err = AppEmbed.warning(
        'Saluran Belum Diatur',
        'Saluran sambutan belum dikonfigurasi. Atur melalui Dashboard atau perintah `/setup welcome_channel:#channel` terlebih dahulu.'
      );
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const channel = await interaction.guild.channels.fetch(welcome.channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      const err = AppEmbed.error(
        'Saluran Tidak Ditemukan',
        'Saluran yang dipilih tidak dapat diakses atau bot tidak memiliki izin melihat saluran tersebut.'
      );
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const rawMessage = welcome.message || 'Selamat datang di {server}, {user}! Anda adalah anggota ke-{memberCount}.';
    const formatted = WelcomeService.formatMessage(rawMessage, interaction.member);

    const embed = AppEmbed.primary('🎉 [Uji Coba] Selamat Datang!', formatted)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Pesan Uji Coba Sambutan oleh Administrator' });

    await channel.send({ content: `<@${interaction.user.id}> *(Uji Coba Pesan Sambutan)*`, embeds: [embed] });

    const success = AppEmbed.success(
      'Uji Coba Terkirim! ✅',
      `Pesan sambutan telah dikirim ke saluran <#${channel.id}>.`
    );
    await interaction.reply({ embeds: [success], ephemeral: true });
  },
};
