const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// ==========================================
// TUTAJ WPISZ SWÓJ TOKEN W CUDZYSŁOWIE
// ==========================================
const token = 'token';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

// Ładowanie komend z folderu commands
// Ładowanie komend z folderu commands
// Ładowanie komend bezpośrednio z folderów kategorii
const categories = ['beemo', 'giveway', 'invitelogger', 'statbot', 'ticketking'];

for (const category of categories) {
    const categoryPath = path.join(__dirname, category);
    
    if (fs.existsSync(categoryPath)) {
        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(categoryPath, file);
            const command = require(filePath);
            
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`[KOMENDA] Załadowano: ${command.data.name} (z folderu ${category})`);
            }
        }
    }
}
// Ładowanie eventów z folderu events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

// Obsługa komend slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Wystąpił błąd podczas wykonywania tej komendy!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Wystąpił błąd podczas wykonywania tej komendy!', ephemeral: true });
        }
    }
});

// Zabezpieczenia błędów
process.on('unhandledRejection', error => {
    console.error('Wystąpił nieobsłużony błąd:', error);
});

// Logowanie bota
client.login(token);