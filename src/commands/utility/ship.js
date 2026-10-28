import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('Mengukur kecocokan cinta atau persahabatan antara dua pengguna.')
    .addUserOption((opt) => opt.setName('user1').setDescription('Pengguna pertama').setRequired(true))
    .addUserOption((opt) => opt.setName('user2').setDescription('Pengguna kedua').setRequired(false)),
  category: 'Utility',
  async execute(interaction) {
    const user1 = interaction.options.getUser('user1');
    const user2 = interaction.options.getUser('user2') || interaction.user;

    // Deterministic or pseudo-random percentage based on user IDs combined
    const combinedId = BigInt(user1.id) + BigInt(user2.id);
    const score = Number(combinedId % 101n);

    let comment = 'Bagaikan air dan minyak... 💔';
    if (score >= 80) comment = 'Pasangan sejati yang ditakdirkan! 💖';
    else if (score >= 50) comment = 'Potensi hubungan yang sangat manis! 💕';
    else if (score >= 25) comment = 'Mungkin perlu sedikit lebih banyak usaha bersama. 🤔';

    const embed = AppEmbed.primary(
      'Kalkulator Kecocokan (Ship) 💞',
      `**${user1.username}** & **${user2.username}**\n\n` +
      `**Persentase Kecocokan:** \`${score}%\`\n` +
      `**Penilaian:** ${comment}`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
