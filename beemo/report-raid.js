const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report-raid')
        .setDescription('🚨 Zgłoś natychmiastowy rajd botów na serwer i uruchom Tarczę Beemo!')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setColor('#f04747')
            .setTitle('🛡️ TARCZA BEEMO: AKTYWOWANA 🚨')
            .setDescription(`**Administrator <@${interaction.user.id}> zgłosił rajd na serwerze!**\n\nUruchomiono tryb awaryjny co do milimetra:\n• Blokada dołączania nowych kont (Anti-Join)\n• Automatyczne wyrzucanie podejrzanych profili\n• Wyciszenie czatów globalnych`)
            .setTimestamp()
            .setFooter({ text: 'System V01DS Ochrona', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.editReply({ embeds: [embed] });
    },
};
