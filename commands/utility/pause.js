const { SlashCommandBuilder } = require('discord.js');
const { VoiceConnectionStatus } = require('@discordjs/voice');
const playModule = require('./play.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pausa a música atual'),
    async execute(interaction) {
        const currentConnection = playModule.getCurrentConnection();
        if (currentConnection && currentConnection.state.status === VoiceConnectionStatus.Ready) {
            playModule.pause();
            interaction.reply('👍 Música pausada!');
        } else {
            interaction.reply('❌ O bot não ta tocando nada não meu fi');
        }
    }
};