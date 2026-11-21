const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');

// Baza pytań: pytanie, poprawna odpowiedź, oraz dwie błędne odpowiedzi do wyboru
const questionsPool = [
    { question: "Ile to jest 2 + 2?", correct: "4", wrongs: ["3", "5"] },
    { question: "Ile to jest 5 - 3?", correct: "2", wrongs: ["1", "4"] },
    { question: "Jaki kolor ma trawa?", correct: "Zielony", wrongs: ["Czerwony", "Niebieski"] },
    { question: "Ile to jest 3 * 3?", correct: "9", wrongs: ["6", "8"] },
    { question: "Wpisz wynik: 10 / 2", correct: "5", wrongs: ["2", "10"] }
];

// Funkcja do losowego mieszania elementów w tablicy
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weryfikacja-setup')
        .setDescription('Tworzy panel weryfikacji z pytaniem i przyciskami do wyboru.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option =>
            option
                .setName('ranga')
                .setDescription('Wybierz rangę, która ma być nadawana po weryfikacji')
                .setRequired(true)
        ),

    async execute(interaction) {
        const targetRole = interaction.options.getRole('ranga');

        // Losujemy jedno pytanie z puli
        const randomQ = questionsPool[Math.floor(Math.random() * questionsPool.length)];

        // Łączymy poprawną i błędne odpowiedzi, a potem je mieszamy
        const allAnswers = shuffleArray([randomQ.correct, ...randomQ.wrongs]);

        // Tworzymy embed z pytaniem
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🛡️ Weryfikacja Anty-Bot')
            .setDescription(`Aby otrzymać rangę **@${targetRole.name}**, kliknij przycisk z **poprawną odpowiedzią** na poniższe pytanie:\n\n**❓ ${randomQ.question}**`)
            .setFooter({ text: 'System V01DS Weryfikacja' });

        // Tworzymy przyciski z unikalnym ID dla każdego przycisku (dopisujemy losową liczbę na końcu)
        const buttons = allAnswers.map(ans => {
            const isCorrect = (ans === randomQ.correct);
            const uniqueId = Math.random().toString(36).substring(2, 7);
            
            return new ButtonBuilder()
                .setCustomId(`verify_ans_${targetRole.id}_${isCorrect}_${uniqueId}`)
                .setLabel(ans)
                .setStyle(ButtonStyle.Secondary);
        });

        const row = new ActionRowBuilder().addComponents(buttons);

        // Wysyłamy embed i przyciski na kanał
        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    },
};