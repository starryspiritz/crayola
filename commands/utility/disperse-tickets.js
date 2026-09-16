const { SlashCommandBuilder, MessageFlags, EmbedBuilder, Guild, Embed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disperse-tickets')
        .setDescription('== TEST ONLY == Disperse monthly tickets.'),
    async execute(interaction) {
        
    }
}