import { AttachmentBuilder } from 'discord.js';
import { TicketService } from '../../services/ticketService.js';
import { ticketRepository } from '../../repositories/ticketRepository.js';
import { LIMITS } from '../../config/constants.js';
import { AppEmbed } from '../../utils/embedBuilder.js';
import { logger } from '../../utils/logger.js';

export async function handleTicketButtons(interaction) {
  const { customId } = interaction;

  // 1. Create Ticket Button
  if (customId === 'ticket_create_open') {
    const openCount = await ticketRepository.countUserOpenTickets(interaction.guild.id, interaction.user.id);
    if (openCount >= LIMITS.MAX_TICKETS_PER_USER) {
      const err = AppEmbed.warning(
        'Batas Tiket Tercapai',
        `Anda sudah memiliki ${openCount} tiket yang masih terbuka. Harap selesaikan tiket Anda sebelumnya terlebih dahulu.`
      );
      await interaction.reply({ embeds: [err], ephemeral: true });
      return true;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const { channel } = await TicketService.createTicketChannel({
        guild: interaction.guild,
        user: interaction.user,
        categoryName: 'Dukungan Umum',
        subject: 'Bantuan Pengguna',
      });

      const success = AppEmbed.success(
        'Tiket Dibuka!',
        `Tiket bantuan Anda telah dibuat di saluran <#${channel.id}>.`
      );
      await interaction.editReply({ embeds: [success] });
    } catch (err) {
      logger.error({ error: err.message }, 'Failed to create ticket channel');
      const errEmbed = AppEmbed.error('Gagal Membuat Tiket', 'Terjadi kesalahan sistem saat membuat saluran tiket.');
      await interaction.editReply({ embeds: [errEmbed] });
    }

    return true;
  }

  // 2. Claim Ticket Button
  if (customId.startsWith('ticket_claim_')) {
    const ticketId = customId.replace('ticket_claim_', '');
    await ticketRepository.claimTicket(ticketId, interaction.user.id);

    const embed = AppEmbed.info(
      'Tiket Diklaim',
      `Tiket ini telah diklaim dan akan ditangani oleh staf <@${interaction.user.id}>.`
    );
    await interaction.reply({ embeds: [embed] });
    return true;
  }

  // 3. Transcript Button
  if (customId.startsWith('ticket_transcript_')) {
    await interaction.deferReply({ ephemeral: true });

    const transcriptText = await TicketService.generateTranscript(interaction.channel);
    const buffer = Buffer.from(transcriptText, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `transcript-${interaction.channel.name}.txt` });

    await interaction.editReply({
      content: 'Berikut adalah berkas transkrip percakapan tiket ini:',
      files: [attachment],
    });
    return true;
  }

  // 4. Close Ticket Button
  if (customId.startsWith('ticket_close_')) {
    const ticketId = customId.replace('ticket_close_', '');

    await interaction.reply({
      content: '🔒 Tiket ditutup. Menyimpan transkrip dan menghapus saluran dalam 5 detik...',
    });

    try {
      const transcriptText = await TicketService.generateTranscript(interaction.channel);
      await ticketRepository.saveTranscript(ticketId, transcriptText, 'TXT');
      await ticketRepository.closeTicket(ticketId, `Ditutup oleh ${interaction.user.tag}`);

      setTimeout(async () => {
        await interaction.channel.delete('Tiket selesai dan ditutup.').catch(() => null);
      }, 5000);
    } catch (err) {
      logger.error({ error: err.message }, 'Error closing ticket');
    }

    return true;
  }

  return false;
}
