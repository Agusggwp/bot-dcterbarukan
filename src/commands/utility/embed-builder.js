import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { COLORS } from '../../config/constants.js';

export default {
  data: new SlashCommandBuilder()
    .setName('embed-builder')
    .setDescription('Membuat custom embed pesan dengan mudah.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) => opt.setName('judul').setDescription('Judul embed').setRequired(true))
    .addStringOption((opt) => opt.setName('deskripsi').setDescription('Isi pesan deskripsi').setRequired(true))
    .addStringOption((opt) =>
      opt.setName('warna').setDescription('Kode HEX warna (contoh: #5865F2)').setRequired(false)
    )
    .addStringOption((opt) => opt.setName('footer').setDescription('Teks footer').setRequired(false))
    .addStringOption((opt) => opt.setName('gambar').setDescription('URL gambar').setRequired(false)),
  category: 'Utility',
  async execute(interaction) {
    const title = interaction.options.getString('judul');
    const description = interaction.options.getString('deskripsi');
    const hexColor = interaction.options.getString('warna');
    const footer = interaction.options.getString('footer');
    const imageUrl = interaction.options.getString('gambar');

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(hexColor && /^#[0-9A-F]{6}$/i.test(hexColor) ? hexColor : COLORS.PRIMARY)
      .setTimestamp();

    if (footer) embed.setFooter({ text: footer });
    if (imageUrl && /^https?:\/\/.+/i.test(imageUrl)) embed.setImage(imageUrl);

    await interaction.reply({ embeds: [embed] });
  },
};
