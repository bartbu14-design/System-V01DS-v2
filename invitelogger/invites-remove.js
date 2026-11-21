const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Ścieżka do pliku invites.json w głównym folderze bota
const dataPath = path.join(__dirname, '../../invites.json');

function getInvitesData() {
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function saveInvitesData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('usun-zaproszenia')
        .setDescription('Odejmuje zaproszenia wybranemu użytkownikowi')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption(option =>
            option.setName('uzytkownik')
                .setDescription('Wybierz użytkownika')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('ilosc')
                .setDescription('Liczba zaproszeń do odjęcia')
                .setRequired(true)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('uzytkownik');
        const amount = interaction.options.getInteger('ilosc');
        const guildId = interaction.guild.id;

        const data = getInvitesData();
        if (!data[guildId]) data[guildId] = {};
        if (!data[guildId][targetUser.id]) data[guildId][targetUser.id] = { added: 0, left: 0, fake: 0 };

        let current = data[guildId][targetUser.id].added || 0;
        current -= amount;
        if (current < 0) current = 0; // Zapobiega zejściu poniżej zera

        data[guildId][targetUser.id].added = current;
        saveInvitesData(data);

        const embed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('📉 Odjęto zaproszenia')
            .setDescription(`Pomyślnie odjęto **${amount}** zaproszeń użytkownikowi ${targetUser}.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    },
};