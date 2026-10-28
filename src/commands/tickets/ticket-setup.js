import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Membuat panel tombol pembukaan tiket bantuan di saluran tertentu.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((opt) =>
      opt
        .setName('saluran')
        .setDescription('Saluran tempat panel tiket akan ditaruh')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('judul').setDescription('Judul panel tiket').setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName('deskripsi').setDescription('Petunjuk pembuatan tiket').setRequired(false)
    ),
  category: 'Tickets',
  async execute(interaction) {
    const channel = interaction.options.getChannel('saluran');
    const title = interaction.options.getString('judul') || 'Pusat Bantuan & Tiket Dukungan';
    const description =
      interaction.options.getString('deskripsi') ||
      'Butuh bantuan, ingin melaporkan sesuatu, atau bertanya kepada staf?\n\n' +
      'Klik tombol **Buat Tiket** di bawah untuk membuka saluran percakapan privat bersama tim kami.';

    const embed = AppEmbed.primary(`🎫 ${title}`, description)
      .setFooter({ text: 'Sistem Tiket Otomatis • Harap gunakan dengan bijak' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_create_open')
        .setLabel('Buat Tiket Dukungan')
        .setEmoji('📩')
        .setStyle(ButtonStyle.Success)
    );

    await channel.send({ embeds: [embed], components: [row] });

    const reply = AppEmbed.success(
      'Panel Tiket Berhasil Dibuat',
      `Panel tiket telah dikirim ke saluran <#${channel.id}>.`
    );

    await interaction.reply({ embeds: [reply], ephemeral: true });
  },
};
