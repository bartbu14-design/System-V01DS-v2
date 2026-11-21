const { Collection } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        // Wyświetla informację o poprawnym zalogowaniu bota w konsoli CMD
        console.log(`🤖 Bot ${client.user.tag} jest gotowy do działania!`);

        // Przygotowanie kolekcji w pamięci bota na statystyki zaproszeń
        client.invites = new Collection();

        // Pobranie i zapisanie aktualnych stanów liczników zaproszeń dla każdego serwera
        client.guilds.cache.forEach(async (guild) => {
            try {
                const firstInvites = await guild.invites.fetch();
                client.invites.set(guild.id, new Collection(firstInvites.map(inv => [inv.code, inv.uses])));
                console.log(`✉️ Załadowano i zabezpieczono zaproszenia dla serwera: ${guild.name}`);
            } catch (error) {
                console.error(`Nie udało się pobrać zaproszeń dla serwera ${guild.name}:`, error);
            }
        });
    },
};
