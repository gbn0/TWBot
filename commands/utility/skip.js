const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');
const playModule = require('./play');
const { queue } = require('./play');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Pula a música atual'),
    async execute(interaction) {
        try {
        const vc = interaction.member.voice.channel;
        if(!vc) {
            return await interaction.reply({ content: "Você precisa estar em um canal de voz para usar esse comando!", ephemeral: true });
        }
            if(queue.length > 0) {
                await playModule.playNextSong(playModule.getCurrentConnection(), interaction);

                const embed = new EmbedBuilder()
                    .setColor('#2b71ec')
                    .setAuthor({
                        name: 'Música skipada!',
                        iconURL: 'https://tenor.com/pt-BR/view/legs-spongebob-squarepants-patrick-star-gif-17427508536255721078',
                        url: 'https://www.google.com'
                    })
                    .setDescription('**Próxima música!**');
                return interaction.reply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                  .setColor('#FFFF00')
                  .setDescription('❌ Nenhuma música na fila.');
                return interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
            return interaction.reply('❌ Algo deu errado ao pular a música');
        }
        }

    }