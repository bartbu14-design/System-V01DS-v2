const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user-stats')
    .setDescription('Wyświetla statystyki i informacje o wybranym użytkowniku')
    .addUserOption(option =>
      option
        .setName('uzytkownik')
        .setDescription('Wybierz użytkownika, którego statystyki chcesz sprawdzić')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Pobranie celu (oznaczonego użytkownika lub osoby, która wpisała komendę)
    const targetUser = interaction.options.getUser('uzytkownik') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        content: '❌ Nie znaleziono takiego użytkownika na tym serwerze.',
        ephemeral: true
      });
    }

    // Formatowanie dat (kiedy konto powstało i kiedy dołączyło do serwera)
    const utworzono = `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`;
    const dolaczono = `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`;

    // Pobieranie ról użytkownika (pomijając rolę @everyone)
    const role = member.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .map(r => r.toString())
      .join(', ') || 'Brak ról';

    // Tworzenie estetycznego Embedu ze statystykami
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle(`📊 STATYSTYKI PROFILU: ${targetUser.tag}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Nazwa użytkownika', value: `${targetUser.username}`, inline: true },
        { name: '🆔 ID Użytkownika', value: `${targetUser.id}`, inline: true },
        { name: '📅 Utworzenie konta', value: utworzono, inline: false },
        { name: '📥 Dołączenie do serwera', value: dolaczono, inline: false },
        { name: '🎭 Role na serwerze', value: role, inline: false }
      )
      .setFooter({ text: 'Klan V01DS • Statystyki' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
