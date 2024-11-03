const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js'); 
const { queue } = require('./play');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Mostra as musicas na fila.'),
  async execute(interaction) {
    if (queue.length === 0) {
      return interaction.reply('📜 A fila ta vazia');
    }

    const embed = new EmbedBuilder()
      .setColor('#2b71ec')
        .setAuthor({
          name: 'Queue',
          iconURL: 'https://cdn.discordapp.com/attachments/1175488636033175602/1175488721001398333/queue.png?ex=656b6a2e&is=6558f52e&hm=7573613cbb8dcac83ba5d5fc55ca607cf535dd117b4492b1c918d619aa6fd7ad&',
          url: 'https://discord.gg/FUEHs7RCqz'
        })
      .setDescription(queue.map((song, index) => `**${index + 1}.** ${song.searchQuery}`).join('\n'));

    interaction.reply({ embeds: [embed] });
  },
};
