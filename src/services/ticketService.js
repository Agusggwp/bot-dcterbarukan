import {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { ticketRepository } from '../repositories/ticketRepository.js';
import { guildRepository } from '../repositories/guildRepository.js';
import { AppEmbed } from '../utils/embedBuilder.js';
import { logger } from '../utils/logger.js';

export class TicketService {
  static async createTicketChannel({ guild, user, categoryName = 'General Support', subject = 'Support' }) {
    const config = await guildRepository.getGuildConfig(guild.id);

    // Permission overwrites
    const permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
      {
        id: guild.members.me.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
        ],
      },
    ];

    if (config.modRoleId) {
      permissionOverwrites.push({
        id: config.modRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    }

    if (config.adminRoleId && config.adminRoleId !== config.modRoleId) {
      permissionOverwrites.push({
        id: config.adminRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    }

    // Create channel
    const channelName = `ticket-${user.username.slice(0, 10).toLowerCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites,
    });

    const ticket = await ticketRepository.createTicket({
      guildId: guild.id,
      channelId: channel.id,
      creatorId: user.id,
      category: categoryName,
      subject,
    });

    // Control buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_claim_${ticket.id}`)
        .setLabel('Klaim Tiket')
        .setEmoji('✋')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ticket_close_${ticket.id}`)
        .setLabel('Tutup Tiket')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`ticket_transcript_${ticket.id}`)
        .setLabel('Transkrip')
        .setEmoji('📄')
        .setStyle(ButtonStyle.Secondary)
    );

    const welcomeEmbed = AppEmbed.primary(
      `Tiket #${ticket.ticketNumber} | ${categoryName}`,
      `Halo <@${user.id}>, terima kasih telah menghubungi tim bantuan.\n\n` +
      `**Subjek:** ${subject}\n` +
      `Silakan jelaskan kendala Anda secara detail. Staf kami akan segera merespons.`
    );

    await channel.send({
      content: `<@${user.id}> ${config.modRoleId ? `<@&${config.modRoleId}>` : ''}`,
      embeds: [welcomeEmbed],
      components: [row],
    });

    return { ticket, channel };
  }

  static async generateTranscript(channel, limit = 100) {
    try {
      const messages = await channel.messages.fetch({ limit });
      const sorted = Array.from(messages.values()).reverse();

      let transcript = `========================================================\n`;
      transcript += `TRANSKRIP TIKET: #${channel.name}\n`;
      transcript += `SERVER: ${channel.guild.name} (${channel.guild.id})\n`;
      transcript += `WAKTU EKSPOR: ${new Date().toISOString()}\n`;
      transcript += `========================================================\n\n`;

      for (const msg of sorted) {
        const time = msg.createdAt.toISOString();
        const author = `${msg.author.tag} (${msg.author.id})`;
        const content = msg.cleanContent || '[Attachment/Embed]';
        transcript += `[${time}] ${author}:\n${content}\n\n`;
      }

      return transcript;
    } catch (err) {
      logger.error({ channelId: channel.id, error: err.message }, 'Failed to generate transcript');
      return 'Gagal memuat transkrip pesan.';
    }
  }
}
