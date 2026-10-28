import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderationService.js';
import { LIMITS } from '../../config/constants.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Menghapus sejumlah pesan dalam saluran ini (maks 100).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opt) =>
      opt
        .setName('jumlah')
        .setDescription('Jumlah pesan yang ingin dihapus (1 - 100)')
        .setMinValue(LIMITS.PURGE_MIN)
        .setMaxValue(LIMITS.PURGE_MAX)
        .setRequired(true)
    )
    .addUserOption((opt) =>
      opt.setName('filter_user').setDescription('Hanya hapus pesan dari pengguna ini').setRequired(false)
    ),
  category: 'Moderation',
  async execute(interaction) {
    const amount = interaction.options.getInteger('jumlah');
    const filterUser = interaction.options.getUser('filter_user');

    await interaction.deferReply({ ephemeral: true });

    const result = await ModerationService.purgeMessages({
      channel: interaction.channel,
      amount,
      filterUser,
    });

    if (!result.success) {
      const err = AppEmbed.error('Gagal Menghapus Pesan', result.reason);
      return await interaction.editReply({ embeds: [err] });
    }

    const embed = AppEmbed.success(
      'Pesan Berhasil Dihapus',
      `Berhasil membersihkan **${result.count}** pesan${filterUser ? ` dari <@${filterUser.id}>` : ''}.`
    );

    await interaction.editReply({ embeds: [embed] });
  },
};
