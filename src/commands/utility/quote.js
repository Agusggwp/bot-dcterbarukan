import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

const QUOTES = [
  { text: 'Kode yang baik adalah dokumentasi terbaiknya sendiri.', author: 'Steve McConnell' },
  { text: 'Kesederhanaan adalah prasyarat untuk keandalan.', author: 'Edsger W. Dijkstra' },
  { text: 'Jadikan ia berhasil, jadikan ia benar, jadikan ia cepat.', author: 'Kent Beck' },
  { text: 'Bicaralah murah. Tunjukkan padaku kodenya.', author: 'Linus Torvalds' },
  { text: 'Program harus ditulis untuk dibaca orang, dan hanya secara kebetulan untuk dieksekusi mesin.', author: 'Harold Abelson' },
  { text: 'Satu-satunya cara untuk melakukan pekerjaan hebat adalah mencintai apa yang Anda lakukan.', author: 'Steve Jobs' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Mendapatkan kutipan inspiratif dari tokoh dunia dan teknologi.'),
  category: 'Utility',
  async execute(interaction) {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    const embed = AppEmbed.primary(
      '💬 Kutipan Inspiratif',
      `*"${q.text}"*\n\n— **${q.author}**`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
