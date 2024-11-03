const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('image')
        .setDescription('Receba uma imagem!')
        .addStringOption(option => option
            .setName('termo')
            .setDescription('Termo de busca da imagem')
            .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ content: "Procurando imagem..." , ephemeral: false });
        const image = await axios.get(`http://results.dogpile.com/serp?qc=images&q=${interaction.options.getString('termo')}`);

        $ = cheerio.load(image.data);

        var links = $(".image a.link");

        var urls = new Array(links.length).fill(0).map((v, i) => links.eq(i).attr("href"));


        if(!urls.length) {
            await interaction.followUp("Erro pegando imagem!");
            return;
        }

        await interaction.followUp({content: urls[Math.floor(Math.random() * urls.length)], ephemeral: false});

        // await interaction.reply(image.data[0]);
    },
}