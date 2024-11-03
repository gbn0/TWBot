const { REST, Routes } = require('discord.js');
const { clientId, serverId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for(const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for(const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`O comando em ${filePath} não possui todas as propriedades necessárias.`);
        }
    }
}

const rest = new REST().setToken(token);

(async () => {

    try {
        console.log(`Deletando todos os comandos.`);

        const data = await rest.get(
            Routes.applicationCommands(clientId),
        );

        console.log(data);

        // for(const command of data) {
        //     await rest.delete(
        //         Routes.applicationGuildCommand(clientId, serverId, command.id),
        //     );
        // }

        // console.log(`${data.length} comandos deletados.`);
    } catch(error) {
        console.log(error);
    }
})();

(async () => {
    try {

        console.log(`Atualizando ${commands.length} comandos.`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(data);

        console.log(`${data.length} comandos atualizados.`);
    } catch(error) {
        console.log(error);
    }
})();