import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

function safeEvaluate(expr) {
  // Only allow numbers, basic math operators, parentheses, and spaces
  if (!/^[\d\s+\-*/().%^]+$/.test(expr)) {
    return null;
  }

  // Replace ^ with ** for power
  const sanitized = expr.replace(/\^/g, '**');

  try {
    // Function constructor without global scope access
    const result = new Function(`'use strict'; return (${sanitized});`)();
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('calculate')
    .setDescription('Menghitung operasi matematika aritmatika dengan aman.')
    .addStringOption((opt) =>
      opt.setName('ekspresi').setDescription('Contoh: 15 * (4 + 6) / 2').setRequired(true)
    ),
  category: 'Utility',
  async execute(interaction) {
    const expr = interaction.options.getString('ekspresi');
    const result = safeEvaluate(expr);

    if (result === null) {
      const err = AppEmbed.error('Kalkulasi Gagal', 'Ekspresi tidak valid atau mengandung karakter yang dilarang.');
      return await interaction.reply({ embeds: [err], ephemeral: true });
    }

    const embed = AppEmbed.primary(
      'Kalkulator 🧮',
      `**Soal:** \`${expr}\`\n**Hasil:** \`${result}\``
    );

    await interaction.reply({ embeds: [embed] });
  },
};
