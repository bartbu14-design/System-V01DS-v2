const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../invites.json');

function getInvitesData() {
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Wyświetla statystyki zaproszeń Twoich lub wybranego użytkownika.')
        .addUserOption(option =>
            option.setName('uzytkownik')
                .setDescription('Wybierz użytkownika, którego zaproszenia chcesz sprawdzić.')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('uzytkownik') || interaction.user;
        const guildId = interaction.guild.id;

        const data = getInvitesData();
        
        // Inicjalizacja struktury, jeśli nie istnieje + przygotowanie pod operacje += 1 / -= 1
        if (!data[guildId]) data[guildId] = {};
        if (!data[guildId][targetUser.id]) {
            data[guildId][targetUser.id] = { added: 0, left: 0, fake: 0 };
        }

        const userInvites = data[guildId][targetUser.id];

        // Przykładowe użycie logiki inkrementacji/dekrementacji w razie potrzeby
        // userInvites.added += 0; 
        // userInvites.left -= 0;

        const regularne = userInvites.added || 0;
        const wyszli = userInvites.left || 0;
        const falszywe = userInvites.fake || 0;
        const razem = regularne - wyszli;

        // Pobranie aktualnej daty w ładnym formacie (np. 31.10.2026)
        const currentDate = new Date().toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle(`📊 STATYSTYKI ZAPROSIEN: ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setDescription(`Użytkownik zaprosił łącznie **${razem}** osób na ten serwer.\n📅 **Aktualna data:** ${currentDate}`)
            .addFields(
                { name: '🟩 Regularne', value: `${regularne}`, inline: true },
                { name: '❌ Odeszli', value: `${wyszli}`, inline: true },
                { name: '⚠️ Fałszywe', value: `${falszywe}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'System V01DS Invite Logger', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.editReply({ embeds: [embed] });
    },
};