import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { giveawayRepository } from '../../repositories/giveawayRepository.js';
import { parseDurationToSeconds, formatSecondsToHuman } from '../../utils/timeParser.js';
import { LIMITS } from '../../config/constants.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('giveaway-create')
    .setDescription('Membuat giveaway interaktif baru di saluran ini.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) => opt.setName('hadiah').setDescription('Nama hadiah yang dibagikan').setRequired(true))
    .addStringOption((opt) =>
      opt.setName('durasi').setDescription('Contoh: 10m, 2h, 1d (m=menit, h=jam, d=hari)').setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName('jumlah_pemenang')
        .setDescription('Jumlah pemenang (standar: 1)')
        .setMinValue(1)
        .setMaxValue(LIMITS.MAX_GIVEAWAY_WINNERS)
        .setRequired(false)
    )
    .addRoleOption((opt) =>
      opt.setName('syarat_peran').setDescription('Peran wajib untuk dapat berpartisipasi').setRequired(false)
    ),
  category: 'Giveaways',
  async execute(interaction) {
    const prize = interaction.options.getString('hadiah');
    const durationInput = interaction.options.getString('durasi');
    const winnerCount = interaction.options.getInteger('jumlah_pemenang') || 1;
    const requiredRole = interaction.options.getRole('syarat_peran');

    const durationSeconds = parseDurationToSeconds(durationInput);
    if (!durationSeconds || durationSeconds < 10) {
      const err = AppEmbed.error('Durasi Tidak Valid', 'Durasi minimal adalah 10 detik (contoh: `10m`, `2h`, `1d`).');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const endsAt = new Date(Date.now() + durationSeconds * 1000);
    const endTimestamp = Math.floor(endsAt.getTime() / 1000);

    const embed = AppEmbed.primary(
      `🎉 GIVEAWAY: ${prize} 🎉`,
      `Klik tombol **Ikuti Giveaway** di bawah ini untuk berpartisipasi!\n\n` +
      `🏆 **Pemenang:** \`${winnerCount}\`\n` +
      `👑 **Dipandu oleh:** <@${interaction.user.id}>\n` +
      `⏳ **Berakhir:** <t:${endTimestamp}:R> (<t:${endTimestamp}:F>)\n` +
      (requiredRole ? `🔒 **Syarat Peran:** <@&${requiredRole.id}>\n` : '')
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_enter')
        .setLabel('Ikuti Giveaway')
        .setEmoji('🎉')
        .setStyle(ButtonStyle.Success)
    );

    const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    await giveawayRepository.createGiveaway({
      guildId: interaction.guild.id,
      channelId: interaction.channel.id,
      messageId: message.id,
      prize,
      winnerCount,
      requiredRoleId: requiredRole?.id || null,
      hostedById: interaction.user.id,
      endsAt,
    });
  },
};
