const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Uruchamia profesjonalne losowanie nagrody (Giveaway).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('nagroda')
                .setDescription('Co jest nagrodą w losowaniu?')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('czas')
                .setDescription('Czas trwania losowania (w minutach).')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const nagroda = interaction.options.getString('nagroda');
        const czasMinuty = interaction.options.getInteger('czas');
        const czasMilisekundy = czasMinuty * 60 * 1000;
        
        // Obliczamy czas zakończenia w formacie Discorda dla Embeda
        const czasZakonczenia = `<t:${Math.floor((Date.now() + czasMilisekundy) / 1000)}:R>`;

        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle('🎉 WIELKIE LOSOWANIE (GIVEAWAY) 🎉')
            .setDescription(`**Nagroda:** ${nagroda}\n\n**Koniec losowania:** ${czasZakonczenia}\n**Organizator:** <@${interaction.user.id}>`)
            .addFields({ name: 'Zgłoszeni uczestnicy', value: '👤 0', inline: true })
            .setTimestamp()
            .setFooter({ text: 'System V01DS Giveaway Boat' });

        // Przycisk reakcji do dołączania do konkursu
        const button = new ButtonBuilder()
            .setCustomId('dolacz_giveaway')
            .setLabel('Dołącz')
            .setEmoji('🎉')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        // Wysyłamy losowanie na kanał publiczny
        const giveawayMessage = await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ Pomyślnie uruchomiono losowanie nagrody!' });

        // Tablica na ID użytkowników biorących udział
        const uczestnicy = [];

        // Tworzymy kolektor interakcji dla tego konkretnego przycisku (będzie działał przez czas trwania konkursu)
        const collector = giveawayMessage.createMessageComponentCollector({ 
            filter: i => i.customId === 'dolacz_giveaway', 
            time: czasMilisekundy 
        });

        collector.on('collect', async i => {
            // Jeśli użytkownik już się zapisał, usuwamy go (funkcja wypisania się)
            if (uczestnicy.includes(i.user.id)) {
                const index = uczestnicy.indexOf(i.user.id);
                uczestnicy.splice(index, 1);
                
                await i.reply({ content: '❌ Wypisałeś się z tego losowania.', ephemeral: true });
            } else {
                // Jeśli go nie ma, dopisujemy do listy
                uczestnicy.push(i.user.id);
                await i.reply({ content: '🎉 Pomyślnie zapisałeś się do losowania nagrody!', ephemeral: true });
            }

            // Aktualizujemy licznik na żywo w Embedzie
            const updatedEmbed = EmbedBuilder.from(embed)
                .setFields({ name: 'Zgłoszeni uczestnicy', value: `👤 ${uczestnicy.length}`, inline: true });
            
            await giveawayMessage.edit({ embeds: [updatedEmbed] });
        });

        // Koniec czasu - losowanie zwycięzcy
        collector.on('end', async () => {
            // Blokujemy i wyłączamy przycisk dołączania po zakończeniu
            const disabledButton = ButtonBuilder.from(button).setDisabled(true);
            const disabledRow = new ActionRowBuilder().addComponents(disabledButton);

            if (uczestnicy.length === 0) {
                const endEmbed = EmbedBuilder.from(embed)
                    .setColor('#7289da')
                    .setDescription(`**Nagroda:** ${nagroda}\n\n**Status:** 🔴 Zakończone\n**Wynik:** Nikt nie wziął udziału w losowaniu.`);

                await giveawayMessage.edit({ embeds: [endEmbed], components: [disabledRow] });
                await interaction.channel.send(`📢 Losowanie **${nagroda}** zakończyło się, ale zabrakło chętnych.`);
            } else {
                // Wybieramy losowe ID z tablicy uczestników
                const losowyZwyciezcaId = uczestnicy[Math.floor(Math.random() * uczestnicy.length)];

                const endEmbed = EmbedBuilder.from(embed)
                    .setColor('#7289da')
                    .setDescription(`**Nagroda:** ${nagroda}\n\n**Status:** 🔴 Zakończone\n**Zwycięzca:** <@${losowyZwyciezcaId}>`);

                await giveawayMessage.edit({ embeds: [endEmbed], components: [disabledRow] });
                await interaction.channel.send(`🎉 Gratulacje <@${losowyZwyciezcaId}>! Wygrałeś/aś **${nagroda}**! 🏆`);
            }
        });
    },
};
