const { SlashCommandBuilder, MessageFlags, EmbedBuilder, Guild, Embed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Options for tickets.')
        .addSubcommand((subcommand) => 
            subcommand
                .setName('view')
                .setDescription('View if you have a ticket active!')
                .addUserOption((option) => option.setName('user').setDescription(`View another user's ticket (mods only; leave blank to view your own.)`)),
        )
        .addSubcommand((subcommand) => 
            subcommand
                .setName('use')
                .setDescription('Use your ticket! (mods only)')
                .addUserOption((option) => option.setName('user').setDescription(`Target user.`).setRequired(true)),
        ),
    async execute(interaction) {
        
    }
}