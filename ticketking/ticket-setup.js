const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ChannelSelectMenuBuilder, 
    ChannelType 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Wysyła profesjonalny panel do otwierania zgłoszeń (Ticketów).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option
                .setName('styl')
                .setDescription('Wybierz wygląd panelu dla graczy')
                .setRequired(true)
                .addChoices(
                    { name: 'Guziki (Przyciski)', value: 'buttons' },
                    { name: 'Rozwijana lista (Menu z powodami)', value: 'select' }
                )
        ),

    async execute(interaction) {
        const chosenStyle = interaction.options.getString('styl');

        // Menu wyboru kanału tekstowego na logi i transkrypcje
        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId(`setup_ticket_channel_${chosenStyle}`)
            .setPlaceholder('Wybierz kanał na logi i transkrypcje biletów')
            .addChannelTypes(ChannelType.GuildText)
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(channelSelect);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('⚙️ Konfiguracja Systemu Biletów (Krok 1/2)')
            .setDescription('Wybierz z poniższej listy **kanał tekstowy**, na który mają trafiać logi oraz pliki z transkrypcjami zamkniętych biletów.')
            .setFooter({ text: 'System V01DS Ticket King', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    },
};

