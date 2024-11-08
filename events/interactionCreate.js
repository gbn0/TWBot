const { Events } = require('discord.js');


module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if(!interaction.isChatInputCommand()) return;
    
        const command = interaction.client.commands.get(interaction.commandName);

        if(!command) {
            console.error(`Nenhum comando corresponde a ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch(error) {
            if(interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: "Ocorreu um erro ao executar o comando!", ephemeral: true });
            } else {
                await interaction.reply({ content: "Ocorreu um erro ao executar o comando!", ephemeral: true });
            }
        }
    },
};
