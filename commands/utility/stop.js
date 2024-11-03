const { SlashCommandBuilder } = require('discord.js');
const { VoiceConnectionStatus } = require('@discordjs/voice');
const playModule = require('./play.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Desconecta o bot do canal de voz'),
    async execute(interaction) {
        const currentConnection = playModule.getCurrentConnection();
        if (currentConnection ) {
            playModule.stop();
            interaction.reply('❌ Fim da música!');
        } else {
            interaction.reply('❌ O bot não ta tocando nada não meu fi');
        }
    }
};