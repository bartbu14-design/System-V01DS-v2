const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');

const logsConfig = new Map();

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            // 1. Wybór kanału logów po /ticket-setup
            if (interaction.isChannelSelectMenu() && interaction.customId.startsWith('setup_ticket_channel_')) {
                const selectedChannelId = interaction.values[0];
                logsConfig.set(interaction.guild.id, selectedChannelId);

                const modal = new ModalBuilder()
                    .setCustomId(`ticket_modal_config_${selectedChannelId}`)
                    .setTitle('Konfiguracja Kategorii Biletów');

                const categoriesInput = new TextInputBuilder()
                    .setCustomId('categories_input')
                    .setLabel('Wpisz kategorie (Format: Nazwa | Opis)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Pomoc | Potrzebuję pomocy\nSkarga | Zgłoś gracza')
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(categoriesInput));
                return await interaction.showModal(modal);
            }

            // 2. Wysyłanie formularza kategorii przez admina
            if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_config_')) {
                await interaction.deferReply({ ephemeral: true });
                
                const selectedChannelId = interaction.customId.replace('ticket_modal_config_', '');
                logsConfig.set(interaction.guild.id, selectedChannelId);

                const rawText = interaction.fields.getTextInputValue('categories_input');
                const lines = rawText.split('\n');
                const options = [];

                for (const line of lines) {
                    const parts = line.split('|');
                    const label = parts[0] ? parts[0].trim() : 'Kategoria';
                    const description = parts[1] ? parts[1].trim() : 'Kliknij, aby otworzyć';
                    const value = 'ticket_' + Math.random().toString(36).substring(7);

                    if (options.length < 25) {
                        options.push({
                            label: label.substring(0, 100),
                            description: description.substring(0, 100),
                            value: value,
                            emoji: '🎫'
                        });
                    }
                }

                if (options.length === 0) {
                    return await interaction.editReply({ content: '❌ Nie wpisano poprawnie żadnej kategorii.' });
                }

                const panelEmbed = new EmbedBuilder()
                    .setColor('#00FFFF')
                    .setTitle('Klan • V01DS • TICKETY')
                    .setDescription('💡 • **Wybierz kategorię z listy poniżej, a my ci pomożemy!**')
                    .setTimestamp();

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('ticket_category_select')
                    .setPlaceholder('Wybierz Odpowiednią Kategorie Ticketa')
                    .addOptions(options);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                await interaction.channel.send({ embeds: [panelEmbed], components: [row] });

                await interaction.editReply({
                    content: `✅ Panel utworzony! Kanał logów ustawiony na: <#${selectedChannelId}>`
                });
            }
            // 3. Wybór kategorii przez gracza -> Tworzenie ticketa + Log
            if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category_select') {
                await interaction.deferReply({ ephemeral: true });

                const guild = interaction.guild;
                const member = interaction.member;

                const channelName = `ticket-${member.user.username}`.toLowerCase().replace(/[^a-z0-9]/g, '');

                try {
                    const ticketChannel = await guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: member.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                            },
                            {
                                id: interaction.client.user.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels],
                            }
                        ],
                    });

                    const welcomeEmbed = new EmbedBuilder()
                        .setColor('#00FFFF')
                        .setTitle('🎫 Nowy Ticket')
                        .setDescription(`Witaj ${member}! Utworzyłeś ticket.\n\nOpisz swój problem, a administracja wkrótce odpowie.`);

                    const closeButton = new ButtonBuilder()
                        .setCustomId('close_ticket_btn')
                        .setLabel('Zamknij Ticket')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Danger);

                    const row = new ActionRowBuilder().addComponents(closeButton);

                    await ticketChannel.send({ content: `${member}`, embeds: [welcomeEmbed], components: [row] });

                    // Log o nowym tickecie
                    const logChannelId = logsConfig.get(guild.id);
                    if (logChannelId) {
                        const logChannel = guild.channels.cache.get(logChannelId);
                        if (logChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setColor('#00FF00')
                                .setTitle('📩 Utworzono Nowy Ticket')
                                .addFields(
                                    { name: 'Użytkownik', value: `${member.user.tag} (${member.id})`, inline: true },
                                    { name: 'Kanał Ticketa', value: `${ticketChannel}`, inline: true }
                                )
                                .setTimestamp();

                            await logChannel.send({ embeds: [logEmbed] });
                        }
                    }

                    await interaction.editReply({ content: `✅ Twój ticket został pomyślnie utworzony: ${ticketChannel}!` });
                } catch (err) {
                    console.error('Błąd tworzenia kanału ticketa:', err);
                    await interaction.editReply({ content: '❌ Wystąpił błąd podczas tworzenia kanału ticketa.' });
                }
            }

            // 4. Zamykanie ticketa przyciskiem + Log
            if (interaction.isButton() && interaction.customId === 'close_ticket_btn') {
                await interaction.reply({ content: '🔒 Zamykanie ticketa za 5 sekund...', ephemeral: true });

                const logChannelId = logsConfig.get(interaction.guild.id);
                if (logChannelId) {
                    const logChannel = interaction.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        const closeLogEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('🔒 Zamknięto Ticket')
                            .addFields(
                                { name: 'Zamknięty kanał', value: `#${interaction.channel.name}`, inline: true },
                                { name: 'Zamknięty przez', value: `${interaction.user.tag}`, inline: true }
                            )
                            .setTimestamp();

                        await logChannel.send({ embeds: [closeLogEmbed] });
                    }
                }

                setTimeout(async () => {
                    try {
                        await interaction.channel.delete();
                    } catch (e) {
                        console.error('Nie udało się usunąć kanału:', e);
                    }
                }, 5000);
            }

        } catch (error) {
            console.error('Błąd podczas obsługi interakcji biletów:', error);
        }
    }
};


        
        