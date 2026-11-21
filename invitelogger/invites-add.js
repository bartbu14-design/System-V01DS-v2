const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Ścieżka do pliku invites.json w głównym folderze bota (wchodzimy dwa poziomy wyżej)
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
        .setName('dodaj-zaproszenia')
        .setDescription('Dodaje zaproszenia wybranemu użytkownikowi')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption(option =>
            option.setName('uzytkownik')
                .setDescription('Wybierz użytkownika')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('ilosc')
                .setDescription('Liczba zaproszeń do dodania')
                .setRequired(true)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('uzytkownik');
        const amount = interaction.options.getInteger('ilosc');
        const guildId = interaction.guild.id;

        const data = getInvitesData();
        if (!data[guildId]) data[guildId] = {};
        if (!data[guildId][targetUser.id]) data[guildId][targetUser.id] = { added: 0, left: 0, fake: 0 };

        data[guildId][targetUser.id].added = (data[guildId][targetUser.id].added || 0) + amount;
        saveInvitesData(data);

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('📈 Dodano zaproszenia')
            .setDescription(`Pomyślnie dodano **${amount}** zaproszeń dla użytkownika ${targetUser}.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    },
};