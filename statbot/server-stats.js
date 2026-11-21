const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-stats')
        .setDescription('Wyświetla zaawansowane statystyki i kondycję tego serwera.'),

    async execute(interaction) {
        await interaction.deferReply();

        const { guild } = interaction;
        const totalMembers = guild.memberCount;
        
        const allMembers = await guild.members.fetch();
        const botCount = allMembers.filter(member => member.user.bot).size;
        const humanCount = totalMembers - botCount;

        const totalChannels = guild.channels.cache.size;
        const textChannels = guild.channels.cache.filter(ch => ch.type === 0).size; 
        const voiceChannels = guild.channels.cache.filter(ch => ch.type === 2).size; 

        const premiumTier = guild.premiumTier;
        const premiumSubscriptionCount = guild.premiumSubscriptionCount || 0;

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle(`📊 STATYSTYKI SERWERA: ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👤 Użytkownicy', value: `• Razem: **${totalMembers}**\n• Ludzie: **${humanCount}**\n• Boty: **${botCount}**`, inline: true },
                { name: '📁 Kanały', value: `• Razem: **${totalChannels}**\n• Tekstowe: **${textChannels}**\n• Głosowe: **${voiceChannels}**`, inline: true },
                { name: '💎 Nitro Boost', value: `• Poziom: **${premiumTier}**\n• Ulepszenia: **${premiumSubscriptionCount}**`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'System V01DS Statystyki', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.editReply({ embeds: [embed] });
    },
};
