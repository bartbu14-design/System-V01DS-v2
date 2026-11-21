const { EmbedBuilder, PermissionFlagsBits, Collection } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const guild = member.guild;
        const client = member.client;

        try {
            const newInvites = await guild.invites.fetch();
            const oldInvites = client.invites.get(guild.id);
            
            const invite = newInvites.find(i => oldInvites && i.uses > oldInvites.get(i.code));

            client.invites.set(guild.id, new Collection(newInvites.map(inv => [inv.code, inv.uses])));

            const welcomeChannel = guild.channels.cache.find(ch => 
                ch.isTextBased() && ch.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
            );

            if (welcomeChannel) {
                const inviteEmbed = new EmbedBuilder()
                    .setColor('#f1c40f')
                    .setTimestamp();

                if (invite) {
                    const inviter = invite.inviter;
                    inviteEmbed.setTitle('📥 NOWY UŻYTKOWNIK')
                        .setDescription(`Witaj ${member}! Zostałeś zaproszony przez **${inviter.tag}** (Kod: \`\${invite.code}\`, Użyć: \`\${invite.uses}\`).`);
                } else {
                    inviteEmbed.setTitle('📥 NOWY UŻYTKOWNIK')
                        .setDescription(`Witaj ${member}! Nie udało się ustalić, kto Cię zaprosił (prawdopodobnie integracja lub link własny serwera).`);
                }

                await welcomeChannel.send({ embeds: [inviteEmbed] });
            }
        } catch (error) {
            console.error('Błąd podczas logowania zaproszenia:', error);
        }
    },
};

