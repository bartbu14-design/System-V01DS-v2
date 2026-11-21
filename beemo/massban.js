const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('massban')
        .setDescription('Masowe banowanie użytkowników, którzy dołączyli w ciągu ostatnich X minut.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addIntegerOption(option =>
            option.setName('minuty')
                .setDescription('Czas w minutach (np. zbanuj wszystkich dołączonych w ciągu ostatnich 10 minut)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(60)),

    async execute(interaction) {
        await interaction.deferReply();

        const minuty = interaction.options.getInteger('minuty');
        const teraz = Date.now();
        const granicaCzasu = teraz - (minuty * 60 * 1000);

        const members = await interaction.guild.members.fetch();
        
        const doZbanowania = members.filter(member => 
            member.joinedTimestamp > granicaCzasu && !member.user.bot
        );

        if (doZbanowania.size === 0) {
            return interaction.editReply({ 
                content: `❌ Nie znaleziono żadnych nowych użytkowników, którzy dołączyli w ciągu ostatnich **${minuty}** minut.` 
            });
        }

        let zbanowaniLiczba = 0;

        for (const [id, member] of doZbanowania) {
            try {
                await member.ban({ reason: `Massban: Awaryjne czyszczenie rajdów (Ostatnie ${minuty} min)` });
                zbanowaniLiczba++;
            } catch (error) {
                console.error(`Nie udało się zbanować użytkownika o ID ${id}:`, error);
            }
        }

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🔨 MASOWE BANOWANIE ZAKOŃCZONE')
            .setDescription(`Pomyślnie usunięto konta niespełniające kryteriów bezpieczeństwa.`)
            .addFields(
                { name: 'Kryterium czasu', value: `Ostatnie ${minuty} min`, inline: true },
                { name: 'Zbanowani użytkownicy', value: `👤 ${zbanowaniLiczba} kont`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'System V01DS Ochrona' });

        await interaction.editReply({ embeds: [embed] });
    },
};
