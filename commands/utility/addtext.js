const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtext')
        .setDescription('Adicione texto a uma imagem!')
        .addAttachmentOption(option => option
            .setName('imagem')
            .setDescription('Imagem que o texto será adicionado')
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('textocima')
            .setDescription('Texto a ser adicionado em cima')
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('textobaixo')
            .setDescription('Texto a ser adicionado em baixo')
            .setRequired(false)
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply({ content: "Adicionando texto a imagem..." , ephemeral: false });     
            
            const image = interaction.options.getAttachment('imagem');
            const canvas = createCanvas(image.width, image.height);
            const context = canvas.getContext('2d');

            const background = await loadImage(image.proxyURL);
            
            
            context.drawImage(background, 0, 0, canvas.width, canvas.height);

            context.font = '40px comic-sans';

            context.fillStyle = '#ffffff';
            context.textAlign = 'center';
            

            if(interaction.options.getString('textocima')) {
                context.fillText(interaction.options.getString('textocima'), image.width / 2, image.height / 5, image.width);
            }

            if(interaction.options.getString('textobaixo')) {
                context.fillText(interaction.options.getString('textobaixo'), image.width / 2, image.height - image.height / 10, image.width);
            }

            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'image.png' });

            console.log(attachment);

            await interaction.followUp({ content: "Texto adicionado!", files: [attachment], ephemeral: false });
        } catch(error) {
            console.error(error);
        }
        
    },
};