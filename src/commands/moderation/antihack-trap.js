import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { guildRepository } from '../../repositories/guildRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('antihack-trap')
    .setDescription('Konfigurasi saluran perangkap anti-spam hack (honeypot auto-kick).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Aktifkan saluran perangkap anti-spam hack (siapa pun yang mengetik langsung di-kick)')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Pilih saluran honeypot/perangkap')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('pesan')
            .setDescription('Kustomisasi isi pesan peringatan bot di saluran tersebut')
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('send-warning')
        .setDescription('Kirim atau perbarui pesan peringatan resmi bot ke saluran perangkap')
        .addStringOption((opt) =>
          opt
            .setName('pesan')
            .setDescription('Isi pesan peringatan khusus')
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('disable').setDescription('Nonaktifkan sistem saluran perangkap')
    )
    .addSubcommand((sub) =>
      sub.setName('status').setDescription('Lihat status konfigurasi saluran perangkap saat ini')
    ),
  category: 'Moderation',
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const config = await guildRepository.getGuildConfig(interaction.guild.id);

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel');
      const customMsg = interaction.options.getString('pesan') || 'Jangan kirim pesan ke sini karena ini saluran khusus! Siapa pun yang mengetik di saluran ini akan langsung di-KICK otomatis demi keamanan server.';

      await guildRepository.updateGuildConfig(interaction.guild.id, {
        antiSpamTrapEnabled: true,
        antiSpamTrapChannelId: channel.id,
        antiSpamTrapMessage: customMsg,
      });

      // Send official warning embed to the channel
      const warningEmbed = AppEmbed.error(
        '⛔ PERINGATAN RESMI: SALURAN KHUSUS / TERLARANG',
        customMsg
      ).setFooter({ text: 'Sistem Keamanan Anti-Spam Hack • Mengirim pesan = KICK otomatis' });

      await channel.send({ embeds: [warningEmbed] }).catch(() => null);

      const embed = AppEmbed.success(
        '🛡️ Saluran Perangkap Berhasil Diaktifkan & Pesan Terkirim!',
        `Saluran <#${channel.id}> sekarang ditetapkan sebagai **Saluran Perangkap Anti-Spam Hack**.\n\n` +
        `• **Pesan Peringatan:** Telah dikirimkan otomatis ke saluran <#${channel.id}>.\n` +
        `• **Aksi Otomatis:** Setiap anggota biasa yang mengirim pesan di saluran tersebut akan **langsung di-KICK** dari server dan pesannya dihapus.\n` +
        `• **Pengecualian:** Administrator dan Pemilik Server aman dari auto-kick.`
      );
      return await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'send-warning') {
      const channelId = config.antiSpamTrapChannelId;
      if (!channelId) {
        return await interaction.reply({
          embeds: [AppEmbed.warning('Saluran Belum Diatur', 'Saluran perangkap belum ditentukan. Gunakan `/antihack-trap set` terlebih dahulu.')],
          ephemeral: true,
        });
      }

      const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        return await interaction.reply({
          embeds: [AppEmbed.error('Saluran Tidak Ditemukan', 'Bot tidak dapat mengakses saluran perangkap tersebut.')],
          ephemeral: true,
        });
      }

      const customMsg = interaction.options.getString('pesan') || config.antiSpamTrapMessage || 'Jangan kirim pesan ke sini karena ini saluran khusus! Siapa pun yang mengetik di saluran ini akan langsung di-KICK otomatis demi keamanan server.';

      const warningEmbed = AppEmbed.error(
        '⛔ PERINGATAN RESMI: SALURAN KHUSUS / TERLARANG',
        customMsg
      ).setFooter({ text: 'Sistem Keamanan Anti-Spam Hack • Mengirim pesan = KICK otomatis' });

      await channel.send({ embeds: [warningEmbed] });

      return await interaction.reply({
        embeds: [AppEmbed.success('Pesan Peringatan Terkirim', `Pesan peringatan telah dikirim ke saluran <#${channel.id}>.`)],
        ephemeral: true,
      });
    }

    if (sub === 'disable') {
      await guildRepository.updateGuildConfig(interaction.guild.id, {
        antiSpamTrapEnabled: false,
        antiSpamTrapChannelId: null,
      });

      const embed = AppEmbed.info(
        'Saluran Perangkap Dinonaktifkan',
        'Fitur saluran perangkap anti-spam hack telah dinonaktifkan untuk server ini.'
      );
      return await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'status') {
      const isEnabled = config.antiSpamTrapEnabled;
      const channelId = config.antiSpamTrapChannelId;

      const embed = AppEmbed.primary(
        '🛡️ Status Perangkap Anti-Spam Hack',
        `• **Status:** ${isEnabled ? '🟢 **AKTIF**' : '🔴 **NONAKTIF**'}\n` +
        `• **Saluran Perangkap:** ${channelId ? `<#${channelId}>` : '*(Belum diatur)*'}\n` +
        `• **Tindakan:** Auto-Delete Pesan & Auto-Kick Pengguna\n` +
        `• **Pengecualian:** Administrator Server`
      );
      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
