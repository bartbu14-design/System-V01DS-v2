const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Całkowite zablokowanie lub odblokowanie możliwości pisania na kanale.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption(option =>
            option.setName('akcja')
                .setDescription('Wybierz, czy chcesz włączyć czy wyłączyć blokadę.')
                .setRequired(true)
                .addChoices(
                    { name: 'Włącz Blokadę (Lock)', value: 'on' },
                    { name: 'Wyłącz Blokadę (Unlock)', value: 'off' }
                )),

    async execute(interaction) {
        await interaction.deferReply();
        
        const akcja = interaction.options.getString('akcja');
        const channel = interaction.channel;
        const everyoneRole = interaction.guild.roles.everyone;

        const embed = new EmbedBuilder().setTimestamp();

        if (akcja === 'on') {
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false
            });

            embed.setColor('#ff9900')
                .setTitle('🔒 KANAŁ ZABLOKOWANY')
                .setDescription(`Ten kanał został tymczasowo zamknięty przez administratora <@${interaction.user.id}>.`)
                .setFooter({ text: 'Modyfikacja uprawnień: Beemo Anty-Raid' });

        } else if (akcja === 'off') {
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: null
            });

            embed.setColor('#00ff44')
                .setTitle('🔓 KANAŁ ODBLOKOWANY')
                .setDescription('Blokada została zdjęta. Kanał jest ponownie dostępny do rozmów.')
                .setFooter({ text: 'Modyfikacja uprawnień: Beemo Anty-Raid' });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
