import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { LIMITS } from '../../config/constants.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('massrole')
    .setDescription('Memberikan atau mencabut peran secara massal dengan batas aman.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption((opt) => opt.setName('peran').setDescription('Peran yang akan diproses').setRequired(true))
    .addStringOption((opt) =>
      opt
        .setName('tindakan')
        .setDescription('Pilih tindakan')
        .setRequired(true)
        .addChoices(
          { name: 'Tambah ke Semua Anggota', value: 'ADD_ALL' },
          { name: 'Tambah ke Manusia Saja', value: 'ADD_HUMANS' },
          { name: 'Tambah ke Bot Saja', value: 'ADD_BOTS' },
          { name: 'Hapus dari Semua', value: 'REMOVE_ALL' }
        )
    ),
  category: 'Moderation',
  async execute(interaction) {
    const role = interaction.options.getRole('peran');
    const action = interaction.options.getString('tindakan');

    const botMember = interaction.guild.members.me;
    if (role.position >= botMember.roles.highest.position) {
      const err = AppEmbed.error(
        'Hirarki Peran Tidak Cukup',
        `Peran <@&${role.id}> berada di posisi yang setara atau lebih tinggi dari peran tertinggi bot.`
      );
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    if (role.managed) {
      const err = AppEmbed.error('Peran Dikelola', 'Peran ini dikelola oleh integrasi eksternal atau bot dan tidak dapat diubah secara massal.');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    await interaction.deferReply();
    await interaction.guild.members.fetch();

    let targetMembers = [];
    if (action === 'ADD_ALL') {
      targetMembers = interaction.guild.members.cache.filter((m) => !m.roles.cache.has(role.id));
    } else if (action === 'ADD_HUMANS') {
      targetMembers = interaction.guild.members.cache.filter((m) => !m.user.bot && !m.roles.cache.has(role.id));
    } else if (action === 'ADD_BOTS') {
      targetMembers = interaction.guild.members.cache.filter((m) => m.user.bot && !m.roles.cache.has(role.id));
    } else if (action === 'REMOVE_ALL') {
      targetMembers = interaction.guild.members.cache.filter((m) => m.roles.cache.has(role.id));
    }

    const total = targetMembers.size;
    if (total === 0) {
      const empty = AppEmbed.info('Tidak Ada Perubahan', 'Tidak ada anggota yang memenuhi kriteria untuk diubah perannya.');
      return await interaction.editReply({ embeds: [empty] });
    }

    const isAdd = action.startsWith('ADD');
    let processed = 0;
    const membersArray = Array.from(targetMembers.values());

    // Process in safe batches
    for (let i = 0; i < membersArray.length; i += LIMITS.MASSROLE_BATCH_SIZE) {
      const batch = membersArray.slice(i, i + LIMITS.MASSROLE_BATCH_SIZE);
      await Promise.all(
        batch.map(async (m) => {
          try {
            if (isAdd) await m.roles.add(role.id);
            else await m.roles.remove(role.id);
            processed++;
          } catch {
            // Ignore single failures (e.g. member left)
          }
        })
      );
      // Small throttle pause between batches to prevent Discord Gateway rate limit
      await new Promise((r) => setTimeout(r, 800));
    }

    const successEmbed = AppEmbed.success(
      'Mass Role Selesai',
      `Berhasil ${isAdd ? 'menambahkan' : 'menghapus'} peran <@&${role.id}> untuk **${processed}** anggota.`
    );

    await interaction.editReply({ embeds: [successEmbed] });
  },
};
