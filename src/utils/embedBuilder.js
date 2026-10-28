import { EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../config/constants.js';

export class AppEmbed {
  static success(title, description) {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} ${title}`)
      .setDescription(description || null)
      .setTimestamp();
  }

  static error(title, description) {
    return new EmbedBuilder()
      .setColor(COLORS.ERROR)
      .setTitle(`${EMOJIS.ERROR} ${title}`)
      .setDescription(description || null)
      .setTimestamp();
  }

  static warning(title, description) {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.WARNING} ${title}`)
      .setDescription(description || null)
      .setTimestamp();
  }

  static info(title, description) {
    return new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${EMOJIS.INFO} ${title}`)
      .setDescription(description || null)
      .setTimestamp();
  }

  static primary(title, description) {
    return new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(title)
      .setDescription(description || null)
      .setTimestamp();
  }
}
