import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

const ANSWERS = [
  'Pasti.',
  'Sudah tentu.',
  'Tanpa keraguan.',
  'Ya - tentu saja.',
  'Anda dapat mengandalkannya.',
  'Tanda-tanda mengarah ke ya.',
  'Kemungkinan besar.',
  'Tampaknya bagus.',
  'Ya.',
  'Jawaban berkabut, coba lagi nanti.',
  'Tanyakan lagi nanti.',
  'Lebih baik tidak memberitahumu sekarang.',
  'Tidak bisa diprediksi sekarang.',
  'Konsentrasi dan tanyakan lagi.',
  'Jangan mengandalkannya.',
  'Jawaban saya adalah tidak.',
  'Sumber saya mengatakan tidak.',
  'Tampaknya tidak begitu bagus.',
  'Sangat diragukan.',
];

export default {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Tanyakan pertanyaan pada Magic 8-Ball mistis.')
    .addStringOption((opt) =>
      opt.setName('pertanyaan').setDescription('Pertanyaan yang ingin dijawab').setRequired(true)
    ),
  category: 'Utility',
  async execute(interaction) {
    const question = interaction.options.getString('pertanyaan');
    const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];

    const embed = AppEmbed.primary(
      '🎱 Magic 8-Ball',
      `**Pertanyaan:** ${question}\n\n**Jawaban:** *${answer}*`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
