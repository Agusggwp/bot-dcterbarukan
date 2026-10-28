import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

export default {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Membuat jajak pendapat (polling) dengan beberapa pilihan.')
    .addStringOption((opt) =>
      opt.setName('pertanyaan').setDescription('Pertanyaan polling').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('opsi1').setDescription('Pilihan 1').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('opsi2').setDescription('Pilihan 2').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('opsi3').setDescription('Pilihan 3').setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName('opsi4').setDescription('Pilihan 4').setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName('opsi5').setDescription('Pilihan 5').setRequired(false)
    ),
  category: 'Utility',
  async execute(interaction) {
    const question = interaction.options.getString('pertanyaan');
    const options = [
      interaction.options.getString('opsi1'),
      interaction.options.getString('opsi2'),
      interaction.options.getString('opsi3'),
      interaction.options.getString('opsi4'),
      interaction.options.getString('opsi5'),
    ].filter(Boolean);

    const description = options
      .map((opt, i) => `${NUMBER_EMOJIS[i]} ${opt}`)
      .join('\n\n');

    const embed = AppEmbed.primary(`📊 Polling: ${question}`, description)
      .setFooter({ text: `Dibuat oleh ${interaction.user.tag}` });

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });

    for (let i = 0; i < options.length; i++) {
      await message.react(NUMBER_EMOJIS[i]).catch(() => null);
    }
  },
};
