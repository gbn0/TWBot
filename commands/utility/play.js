const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    StreamType,
    AudioPlayerStatus,
    entersState,
    VoiceConnectionStatus,
} = require('@discordjs/voice');

const ytdl = require('@distube/ytdl-core');
const YouTubeSearch = require('youtube-search');
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
require('dotenv').config();

const youtubeAPIKey = process.env.youtubeAPIKey;


let isPaused = false;

const youtubeSearchOptions = {
    maxResults: 5,
    key: youtubeAPIKey,
};

const queue = [];
let player;
let currentConnection; 
let currentMessage;

module.exports = {
    data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Toca uma música!')
    .addStringOption(option => option
        .setName('query')
        .setDescription('Nome da música a ser tocada')
        .setRequired(true)
    ),
    async execute(interaction) {
        const query = interaction.options.getString('query');
        const vc = interaction.member.voice.channel;

        if(!vc) {
            return await interaction.reply({ content: "Você precisa estar em um canal de voz para usar esse comando!", ephemeral: true });
            
        }

        let connection;
        if(!currentConnection) {
            connection = joinVoiceChannel({
                channelId: interaction.member.voice.channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            currentConnection = connection;
        }

        
        currentMessage = interaction;

        try {
            await getSongInfo(query, interaction).then(async () => {
                createPlayer();
                if(player.state.status === AudioPlayerStatus.Idle) {
                    playNextSong(currentConnection, interaction);
                }
                if(!query.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
                    await interaction.followUp('**👌 Música adicionada a fila!**');
                }
            });
            
        } catch(error) {
            console.error(error);
            return await interaction.reply('**❌ Ocorreu um erro ao adicionar a música a fila!**');
        }
        

        const listener = async (oldState, newState) => {
            if(newState.member.user.bot) {
                return;
            }

            if(oldState.channel && !newState.channel) {
                const membersInChannel = oldState.channel.members.size;
                if(membersInChannel === 1) {
                    interaction.client.removeListener('voiceStateUpdate', listener);

                    if(!connection.destroyed) {
                        connection.destroy();
                        currentConnection = null;
                    }
                }
            }
        };

        

        interaction.client.on('voiceStateUpdate', listener);
   
    },
    queue,
    dequeue,
    playNextSong,
    playSong,
    pause: () => {
        pausePlayback();
    },
    resume: () => {
        resumePlayback();
    },
    getPlayer: () => player,
    getCurrentConnection: () => currentConnection,
    stop: () => {
        stopPlayback();
    },
}

async function getSongInfo(query, interaction) {
    let searchResult;
    if(query.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
        searchResult = await ytdl.getBasicInfo(query);
        if(!searchResult) {
            return await interaction.reply({ content: "Nenhum resultado encontrado!", ephemeral: true });
        }
        const video = searchResult.videoDetails;
        const videoDetails = {
                title: video.title,
                link: video.video_url,
                channelTitle: video.author.name,
                channelId: video.author.id,
                description: video.description,
                kind: video.category,
                thumbnails: video.thumbnails
            };
        enqueue({ video: videoDetails, message: interaction });
        interaction.reply('**👌 Música adicionada a fila!**');
    } else {
        
        try {
            searchResult = await YouTubeSearch(query, youtubeSearchOptions);
        } catch (error) {
            console.log(error);
            return await interaction.reply({ content: "Ocorreu um erro ao procurar a música!", ephemeral: true });
        }


        if(!searchResult || searchResult.length === 0) {
            return await interaction.reply({ content: "Nenhum resultado encontrado!", ephemeral: true });
        }


        const row = new ActionRowBuilder()
        let desc = "";
        let buttons = [];

        for(let i = 0; i < searchResult.results.length; i++) {
            const result = searchResult.results[i];
            buttons.push(new ButtonBuilder()
                .setLabel(`${i + 1}`)
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`${i+1}`)
            )

            desc += `**${i + 1}.** [${result.title}](${result.link})\n`;
        }

        row.addComponents(buttons);

        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Resultado da busca',
                iconURL: 'https://media1.tenor.com/m/mmiOzcM5w7gAAAAd/seu-jorge-bufo-tocando-guitarra.gif',
                url: 'https://www.google.com'
            })
            .setDescription(`\n ‎ \n **Opções:\n** ${desc}`)
            .setColor('#ffffff')
            .setFooter({ text: 'TWBot' });

        const response = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const collectorFilter = i => i.user.id === interaction.user.id;
        
        const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 }).then(i => {
            enqueue({ video: searchResult.results[i.customId - 1], message: interaction });
            interaction.deleteReply();
        });
    }
}


function createPlayer() {
    if (!player) {
        player = createAudioPlayer();
        player.on(AudioPlayerStatus.Idle, async () => {
            await playNextSong(currentConnection, currentMessage);
        });
    }
}

function enqueue(song) {
    queue.push(song);
}

function dequeue() {
    return queue.shift();
}

async function playNextSong(connection, message) {
    if (queue.length > 0) {
        const nextSong = dequeue();
        await playSong(connection, nextSong.video, nextSong.message);
    } else {
        if (!connection.destroyed) {
            setTimeout(() => {
                if(queue.length === 0) {
                    connection.destroy();
                    currentConnection = null;
                    message.followUp('**✨ Fila vazia! Saindo do canal...**');
                }else {
                    message.deleteReply();
                }
            }, 60000);
            
        }
        
    }
}


async function playSong(connection, video, interaction) {
    createPlayer();

    player.pause();

    
    
        const youtubeLink = video.link ? video.link : `https://www.youtube.com/watch?v=${video.id}`;

        const stream = ytdl(youtubeLink, { filter: 'audioonly', highWaterMark: 1 << 25 });
        const videoInfo = await ytdl.getBasicInfo(youtubeLink);
        const resource = createAudioResource(stream, {
            inlineVolume: true,
        })
        
        player.play(resource);
        connection.subscribe(player);

        try {
            
            await entersState(connection, VoiceConnectionStatus.Ready, 50_000);
            await entersState(player, AudioPlayerStatus.Playing, 50_000);

            const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Tocando',
                iconURL: 'https://media1.tenor.com/m/4wKwMtHSDr0AAAAd/music-listening-to-music.gif',
                url: 'https://www.google.com'
            })
            .setDescription(`\n ‎ \n **Detalhes da música :** [${video.title}](${youtubeLink})\n **Duração: ** ${Math.floor(parseInt(videoInfo.videoDetails.lengthSeconds) / 60)}:${parseInt(videoInfo.videoDetails.lengthSeconds) % 60} \n **Views: ** ${videoInfo.videoDetails.viewCount}\n **Canal:** [${video.channelTitle}](https://youtube.com/channel/${video.channelId})`)
            .setImage(video.thumbnails.high !== undefined ? video.thumbnails.high.url : video.thumbnails[0].url)
            .setColor('#ffffff')
            .setFooter({ text: 'TWBot' });

            await interaction.followUp({ embeds: [embed], ephemeral: false });

        } catch (error) {
            console.error(error);
            if(!connection.destroyed) {
                connection.destroy();
            }

            return await interaction.followUp({ content: "Ocorreu um erro ao tocar a música!", ephemeral: true });
        }
 
}


function pausePlayback() {
    if (player && player.state.status === AudioPlayerStatus.Playing) {
        player.pause();
        isPaused = true;

        return;
    } else {
        return;
    }
}


function resumePlayback() {
    if (player && player.state.status === AudioPlayerStatus.Paused) {
        player.unpause();
        isPaused = false;

        return;
    } else {
        return;
    }
}

function stopPlayback() {
    if (player && currentConnection) {
        player.stop();
        queue.length = 0;
        currentConnection.destroy();
        currentConnection = null;
        return;
    } else {
        return;
    }
}