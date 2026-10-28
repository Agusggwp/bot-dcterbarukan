import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Mengirim pengumuman resmi ke saluran tertentu.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName('saluran')
        .setDescription('Pilih saluran tempat pengumuman akan dikirim')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('judul').setDescription('Judul pengumuman').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('pesan').setDescription('Isi pesan pengumuman').setRequired(true)
    )
    .addBooleanOption((opt) =>
      opt.setName('mention_everyone').setDescription('Apakah ingin mention @everyone?').setRequired(false)
    ),
  category: 'Utility',
  async execute(interaction) {
    const channel = interaction.options.getChannel('saluran');
    const title = interaction.options.getString('judul');
    const message = interaction.options.getString('pesan');
    const mentionEveryone = interaction.options.getBoolean('mention_everyone') || false;

    const embed = AppEmbed.primary(`📢 ${title}`, message)
      .setFooter({ text: `Diumumkan oleh ${interaction.user.tag}` });

    await channel.send({
      content: mentionEveryone ? '@everyone' : null,
      embeds: [embed],
    });

    const reply = AppEmbed.success('Pengumuman Terkirim', `Pengumuman berhasil dipublikasikan di <#${channel.id}>.`);
    await interaction.reply({ embeds: [reply], ephemeral: true });
  },
};
