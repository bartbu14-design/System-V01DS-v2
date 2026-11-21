const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot Klanu V01DS działa poprawnie 24/7!');
});

app.listen(PORT, () => {
    console.log(`[HTTP] Serwer nasłuchuje na porcie ${PORT}`);
});

// --- ZABEZPIECZENIE SIECIOWE ---
process.on('unhandledRejection', (reason, promise) => {
    console.log('⚠️ [Ostrzeżenie sieciowe]:', reason?.message || reason);
});

process.on('uncaughtException', (err, origin) => {
    console.log('⚠️ [Ostrzeżenie systemowe]:', err?.message || err);
});

const { Client, GatewayIntentBits, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// ==========================================
// 1. KONFIGURACJA TOKENA BOTA
// ==========================================
const token = process.env.TOKEN;
// ==========================================
// 2. INICJALIZACJA CACHE ZAPROSZEŃ I KLIENTA
// ==========================================
const invitesCache = new Map();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites // <--- Wymagane do śledzenia zaproszeń!
    ]
});

// Kolekcje do przechowywania komend
client.commands = new Collection();
client.cooldowns = new Collection();

// ==========================================
// 3. ŁADOWANIE KOMEND Z FOLDERÓW KATEGORII
// ==========================================
const categories = ['beemo', 'giveway', 'invitelogger', 'statbot', 'ticketking', 'startit'];

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
            } else {
                console.log(`[OSTRZEŻENIE] Plik ${file} w ${category} nie ma 'data' lub 'execute'.`);
            }
        }
    }
}

// ==========================================
// 4. ŁADOWANIE EVENTÓW Z FOLDERU /events
// ==========================================
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
        console.log(`[EVENT] Załadowano event: ${event.name}`);
    }
}

// ==========================================
// 5. GŁÓWNY OBSŁUGIWACZ INTERAKCJI (KOMENDY I PRZYCISKI)
// ==========================================
client.on('interactionCreate', async interaction => {
    // A. Obsługa przycisków weryfikacji (proste i z pytaniami)
    if (interaction.isButton()) {
        const customId = interaction.customId;

        // Przypadek 1: verify_btn_IDRANGI
        if (customId.startsWith('verify_btn_')) {
            const roleId = customId.replace('verify_btn_', '');
            const member = interaction.member;
            const role = interaction.guild.roles.cache.get(roleId);

            if (!role) {
                return interaction.reply({ content: '❌ Nie znaleziono takiej rangi na tym serwerze!', ephemeral: true });
            }

            try {
                await member.roles.add(role);
                return interaction.reply({ content: `✅ Pomyślnie zweryfikowano! Otrzymałeś rangę **${role.name}**.`, ephemeral: true });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: '❌ Bot nie ma uprawnień, aby nadać tę rangę (ustaw rangę bota wyżej na liście ról w ustawieniach serwera!).', ephemeral: true });
            }
        }

        // Przypadek 2: verify_ans_IDRANGI_true/false
        if (customId.startsWith('verify_ans_')) {
            const parts = customId.split('_');
            const roleId = parts[2];
            const isCorrect = parts[3] === 'true';
            const member = interaction.member;
            const role = interaction.guild.roles.cache.get(roleId);

            if (!role) {
                return interaction.reply({ content: '❌ Nie znaleziono takiej rangi na tym serwerze!', ephemeral: true });
            }

            if (isCorrect) {
                try {
                    await member.roles.add(role);
                    return interaction.reply({ content: `✅ **Poprawnie!** Otrzymałeś rangę **${role.name}**.`, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    return interaction.reply({ content: '❌ Bot nie ma uprawnień, aby nadawać tę rangę (ustaw rangę bota wyżej w zakładce Role!).', ephemeral: true });
                }
            } else {
                return interaction.reply({ content: '❌ **Błędna odpowiedź!** Spróbuj ponownie kliknąć poprawny przycisk.', ephemeral: true });
            }
        }
    }

    // B. Obsługa komend Slash (ukośnika)
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const errorMsg = { content: '❌ Wystąpił błąd podczas wykonywania tej komendy!', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMsg);
            } else {
                await interaction.reply(errorMsg);
            }
        }
    }
});

// ==========================================
// 6. START BOTA, REJESTRACJA KOMEND I CACHE ZAPROSZEŃ
// ==========================================
client.once('ready', async () => {
    console.log(`========================================`);
    console.log(`✅ Zalogowano pomyślnie jako: ${client.user.tag}`);
    console.log(`🤖 Bot Klan V01DS jest w pełni gotowy do działania!`);
    console.log(`========================================`);
    
    client.user.setActivity('Klan V01DS • /ticket', { type: 3 });

    // Rejestracja globalna komend
    try {
        console.log('[API] Rozpoczynam wysyłanie komend globalnych do API Discorda...');
        const commandsData = Array.from(client.commands.values()).map(command => command.data.toJSON());
        await client.application.commands.set(commandsData);
        console.log(`[API] Pomyślnie zarejestrowano globalnie ${commandsData.length} komend!`);
    } catch (error) {
        console.error('[API] Błąd podczas rejestracji komend:', error);
    }

    // Pobieranie zaproszeń do cache dla każdego serwera
    for (const guild of client.guilds.cache.values()) {
        try {
            const firstInvites = await guild.invites.fetch();
            invitesCache.set(guild.id, new Map(firstInvites.map((i) => [i.code, i])));
        } catch (err) {
            console.error(`Nie udało się pobrać zaproszeń dla serwera ${guild.name}:`, err);
        }
    }
});

// ==========================================
// 7. LOGOWANIE BOTA
// ==========================================
client.login(token);