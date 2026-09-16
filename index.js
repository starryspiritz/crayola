const Sequelize = require('sequelize')
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection, Message, MessageFlags, GuildMembers, EmbedBuilder, Embed } = require('discord.js');
const { token } = require('./config.json');
const viewTicket = require('./commands/utility/view-ticket');

const client = new Client({ intents: [GatewayIntentBits.Guilds]});
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'tickets.sqlite',
});
const Tags = sequelize.define('tags', {
    username: {
        type: Sequelize.STRING,
        unique: true,
    },
    userID: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        unique: true,
    },
    ticket: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
    }
})

client.once(Events.ClientReady, async (readyClient) => {
    Tags.sync();
    client.user.setPresence({ activities: [{ name: "in the orchard"}], status: "online"});
    console.log('Locked in and ready!');
});

// Check for date
setInterval(async () => {
    const date = new Date();
    const currentDay = date.getDate();
    console.log(currentDay);
    if (currentDay == 15) {
        const allEntries = await Tags.findAll({ where: { ticket: 0} });
        var count = 0;
        for (count in allEntries) {
            await Tags.update({ ticket: 1 }, { where: { username: allEntries[count].username }});
            count = count + 1;
        }
        const ticketDispurse = new EmbedBuilder()
            .setColor(0xffd200)
            .setTitle(`🎟️  Your monthly tickets have arrived!`)
            .setDescription(`Please note that if you have one already, you won't be granted another until it's used.`);
        const targetChannel = await interaction.guild.channels.fetch(`1304456647690682419`);
        targetChannel.send({ content: `<@&1304456099315060767> <@&1304460169526116374>`, embeds: [ticketDispurse] });
        }
}, 1000);

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log('idiot.')
        }
    }
}

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    const { commandName } = interaction;

    if (commandName === 'disperse-tickets') {
        const allEntries = await Tags.findAll({ where: { ticket: 0} });
        var count = 0;
        for (count in allEntries) {
            await Tags.update({ ticket: 1 }, { where: { username: allEntries[count].username }});
            count = count + 1;
        }
        const ticketDispurse = new EmbedBuilder()
            .setColor(0xffd200)
            .setTitle(`🎟️  Your monthly tickets have arrived!`)
            .setDescription(`Please note that if you have one already, you won't be granted another until it's used.`);
        const targetChannel = await interaction.guild.channels.fetch(`1541504281369256057`);
        targetChannel.send({ content: `<@&1304456099315060767> <@&1304460169526116374>`, embeds: [ticketDispurse] });
    }

    if(commandName === 'ticket') {
        if (interaction.options.getSubcommand() === 'view') {
            const target = interaction.options.getUser('user');
            // Check if "user" option was added
            if (target) {
                // Check for mod/owner role
                if (interaction.member.roles.cache.has("944035817351942174") || interaction.member.roles.cache.has("944032944949968967")) {
                    // Check that target user is a supporter
                    if (await interaction.guild.members.cache.get(`${target.id}`).roles.cache.has("1304456099315060767") || await interaction.guild.members.cache.get(`${target.id}`).roles.cache.has("1304460169526116374")) {
                        const tag = await Tags.findOne({ where: { username: target.username }});
                        if (tag) {
                            const ticketAmt = tag.get('ticket')
                                if (ticketAmt > 0) {
                                    const ticketDetails = new EmbedBuilder()
                                        .setColor(0xb2aafd)
                                        .setAuthor({ name: `${target.displayName} (@${target.username})`, iconURL: target.displayAvatarURL()})
                                        .setTitle(`🎟️  ${target.displayName} has a ticket avaliable!`)
                                    await interaction.reply({
                                        embeds: [ticketDetails],
                                    })
                                } else if (ticketAmt == 0) {
                                    const ticketDetails = new EmbedBuilder()
                                        .setColor(0xb2aafd)
                                        .setAuthor({ name: `${target.displayName} (@${target.username})`, iconURL: target.displayAvatarURL()})
                                        .setTitle(`❎  ${target.displayName} doesn't have a ticket right now.`)
                                        .setDescription(`They'll receive their next ticket in some amount of days.`)
                                    await interaction.reply({
                                        embeds: [ticketDetails],
                                    })
                                }
                        } else {
                            const dbInit = new EmbedBuilder().setColor(0xb2aafd)
                                .setTitle(`<a:load:1544806958253473913>   ${target.displayName} hasn't been added to the ticket system yet- sit tight!`)
                            await interaction.reply({ embeds: [dbInit]});
                            try {
                                // Add target user to the database
                                await Tags.create({
                                    username: target.username,
                                    userID: target.id,
                                })
                                const ticketDetails = new EmbedBuilder()
                                    .setColor(0xb2aafd)
                                    .setAuthor({ name: `${target.displayName} (@${target.username})`, iconURL: target.displayAvatarURL()})
                                    .setTitle(`🎟️  ${target.displayName} has a ticket avaliable!`)
                                await interaction.editReply({
                                    embeds: [ticketDetails],
                                })
                            } catch (error) {
                                console.log(error)
                                const dbInitErr = new EmbedBuilder().setColor(0xdd3e40)
                                    .setTitle(`🚫  An issue occurred when adding ${target.displayName} to the ticket system. Please make of note of this and message <@490492567822008323>.`)
                                await interaction.reply({ embeds: [dbInitErr]});
                            }
                        }
                    } else {
                        // Response if no supporter role
                        const noSupport = new EmbedBuilder()
                            .setAuthor({ name: `${target.displayName} (@${target.username})`, iconURL: target.displayAvatarURL()})
                            .setColor(0xdd3e40)
                            .setTitle(`🚫  ${target.displayName} is not a Supporter+.`)
                            .setDescription(`Only supporters are eligible to use tickets.`)
                        interaction.reply({ embeds: [noSupport]});
                    }
                } else {
                    // Check for Supporter+
                    if (interaction.member.roles.cache.has("1304456099315060767") || interaction.member.roles.cache.has("1304460169526116374")) {
                        if (`${target.id}` === `${interaction.user.id}`){
                            const tag = await Tags.findOne({ where: { username: interaction.user.username }});
                            if (tag) {
                                const ticketAmt = tag.get('ticket')
                                if (ticketAmt > 0) {
                                    const ticketDetails = new EmbedBuilder()
                                        .setColor(0xb2aafd)
                                        .setAuthor({ name: `${interaction.user.displayName} (@${interaction.user.username})`, iconURL: interaction.user.displayAvatarURL()})
                                        .setTitle(`🎟️  You have a ticket avaliable!`)
                                    await interaction.reply({
                                        embeds: [ticketDetails],
                                    })
                                } else if (ticketAmt == 0) {
                                    const ticketDetails = new EmbedBuilder()
                                        .setColor(0xb2aafd)
                                        .setAuthor({ name: `${interaction.user.displayName} (@${interaction.user.username})`, iconURL: interaction.user.displayAvatarURL()})
                                        .setTitle(`❎  You don't have a ticket right now.`)
                                        .setDescription(`You'll receive your next ticket in some amount of days.`)
                                    await interaction.reply({
                                        embeds: [ticketDetails],
                                    })
                                }
                            } else {
                                const dbInit = new EmbedBuilder().setColor(0xb2aafd)
                                    .setTitle(`<a:load:1544806958253473913>   You haven't been added to the ticket system yet- sit tight!`)
                                await interaction.reply({ embeds: [dbInit]});
                                try {
                                    // Add target user to the database
                                    await Tags.create({
                                        username: target.username,
                                        userID: target.id,
                                    })
                                    const ticketDetails = new EmbedBuilder()
                                        .setColor(0xb2aafd)
                                        .setAuthor({ name: `${target.displayName} (@${target.username})`, iconURL: target.displayAvatarURL()})
                                        .setTitle(`🎟️  You have a ticket avaliable!`)
                                    await interaction.editReply({
                                        embeds: [ticketDetails],
                                    })
                                } catch (error) {
                                    console.log(error)
                                    const dbInitErr = new EmbedBuilder().setColor(0xdd3e40)
                                        .setTitle(`🚫  An issue occurred when adding you to the ticket system. Please make of note of this and message <@490492567822008323>.`)
                                    await interaction.reply({ embeds: [dbInitErr]});
                                }
                            }
                        } else {
                            const noMod = new EmbedBuilder()
                                .setColor(0xdd3e40)
                                .setTitle(`🚫  Other's tickets can only be viewed by mods.`)
                                .setDescription(`If you're trying to view your own tickets, leave the field blank or add your name into the 'user' field.`)
                            interaction.reply({ embeds: [noMod]});
                        }
                    } else {
                        const noSupport = new EmbedBuilder()
                            .setColor(0xdd3e40)
                            .setTitle(`🚫  You must be a Supporter+ to use tickets.`)
                            .setDescription(`If you want to support Kat and get early access to adopts and batches, consider [subscribing on Ko-Fi!](https://ko-fi.com/katandstar154/tiers)`)
                        interaction.reply({ embeds: [noSupport]});
                    }
                }
            } else
                // Check if user has Isle Owner (aka, just Kat)
                if (interaction.member.roles.cache.has("944032944949968967")) {
                    const ticketRuler = new EmbedBuilder()
                            .setColor(0xdd3e40)
                            .setTitle(`🚫  You don't need tickets for your own adopts.`)
                        interaction.reply({ embeds: [ticketRuler]});
                } else {
                    // Check for Supporter+
                    if (interaction.member.roles.cache.has("1304456099315060767") || interaction.member.roles.cache.has("1304460169526116374")) {
                        const tag = await Tags.findOne({ where: { username: interaction.user.username }});
                        if (tag) {
                            const ticketAmt = tag.get('ticket')
                            if (ticketAmt > 0) {
                                const ticketDetails = new EmbedBuilder()
                                    .setColor(0xb2aafd)
                                    .setAuthor({ name: `${interaction.user.displayName} (@${interaction.user.username})`, iconURL: interaction.user.displayAvatarURL()})
                                    .setTitle(`🎟️  You have a ticket avaliable!`)
                                await interaction.reply({
                                    embeds: [ticketDetails],
                                })
                            } else if (ticketAmt == 0) {
                                const ticketDetails = new EmbedBuilder()
                                    .setColor(0xb2aafd)
                                    .setAuthor({ name: `${interaction.user.displayName} (@${interaction.user.username})`, iconURL: interaction.user.displayAvatarURL()})
                                    .setTitle(`❎  You don't have a ticket right now.`)
                                    .setDescription(`You'll receive your next ticket in some amount of days.`)
                                await interaction.reply({
                                    embeds: [ticketDetails],
                                })
                            }
                        } else {
                            const dbInit = new EmbedBuilder().setColor(0xb2aafd)
                                .setTitle(`<a:load:1544806958253473913>   You haven't been added to the ticket system yet- sit tight!`)
                            await interaction.reply({ embeds: [dbInit]});
                            try {
                                // Add user to the database
                                await Tags.create({
                                    username: interaction.user.username,
                                    userID: interaction.user.id,
                                })
                                const ticketDetails = new EmbedBuilder()
                                    .setColor(0xb2aafd)
                                    .setAuthor({ name: `${interaction.user.displayName} (@${interaction.user.username})`, iconURL: interaction.user.displayAvatarURL()})
                                    .setTitle(`🎟️  You have a ticket avaliable!`)
                                await interaction.editReply({
                                    embeds: [ticketDetails],
                                })
                            } catch (error) {
                                console.log(error)
                                const dbInitErr = new EmbedBuilder().setColor(0xdd3e40)
                                    .setTitle(`🚫  An issue occurred when adding you to the ticket system. Please make of note of this and message <@490492567822008323>.`)
                                await interaction.reply({ embeds: [dbInitErr]});
                            }
                        }
                    } else {
                        // Supporter plug (sent to members)
                        const noSupport = new EmbedBuilder()
                            .setColor(0xdd3e40)
                            .setTitle(`🚫  You must be a Supporter+ to use tickets.`)
                            .setDescription(`If you want to support Kat and get early access to adopts and batches, consider [subscribing on Ko-Fi!](https://ko-fi.com/katandstar154/tiers)`)
                        interaction.reply({ embeds: [noSupport]});
                    }
                }
        } else
        if (interaction.options.getSubcommand() === 'use') {
            if (interaction.member.roles.cache.has("944035817351942174") || interaction.member.roles.cache.has("944032944949968967")) {
                const target = interaction.options.getUser('user');
                if (await interaction.guild.members.cache.get(`${target.id}`).roles.cache.has("1304456099315060767") || await interaction.guild.members.cache.get(`${target.id}`).roles.cache.has("1304460169526116374")) {
                    // Check if user is on database
                    const tag = await Tags.findOne({ where: { username: target.username } });
                    if (tag) {
                        // TODO: Check to make sure user has ticket
                        if (tag.get('ticket') > 0) {
                            // Update ticket amount
                            const affectedRows = await Tags.update({ ticket: tag.get('ticket') - 1 }, { where: { username: target.username }});
                            if (affectedRows > 0) {
                                const ticketDetails = new EmbedBuilder()
                                    .setColor(0xffd200)
                                    .setAuthor({ name: `${target.displayName} (@${target.username})`, iconURL: target.displayAvatarURL()})
                                    .setTitle(`🎟️  ${target.displayName} used their ticket!`)
                                await interaction.reply({
                                    embeds: [ticketDetails],
                                })
                            }
                        } else {
                            const noTicket = new EmbedBuilder()
                            .setAuthor({ name: `${target.displayName} (@${target.username})`, iconURL: target.displayAvatarURL()})
                            .setColor(0xdd3e40)
                            .setTitle(`🚫  ${target.displayName} doesn't have a ticket to use!`)
                        interaction.reply({ embeds: [noTicket]});
                        }   
                    } else {
                        const dbInit = new EmbedBuilder().setColor(0xb2aafd)
                            .setTitle(`<a:load:1544806958253473913>   ${target.displayName} hasn't been added to the ticket system yet- sit tight!`)
                        await interaction.reply({ embeds: [dbInit]});
                        try {
                            // Add target user to the database
                            const tag = await Tags.create({
                                username: target.username,
                                userID: target.id,
                            })
                            // ...then update their ticket
                            const affectedRows = await Tags.update({ ticket: tag.get('ticket') - 1 }, { where: { username: target.username }});
                            if (affectedRows > 0) {
                                const ticketDetails = new EmbedBuilder()
                                    .setColor(0xffd200)
                                    .setAuthor({ name: `${target.displayName} (@${target.username})`, iconURL: target.displayAvatarURL()})
                                    .setTitle(`🎟️  ${target.displayName} used their ticket!`)
                                await interaction.editReply({
                                    embeds: [ticketDetails],
                                })
                            }
                        } catch (error) {
                            console.log(error)
                            const dbInitErr = new EmbedBuilder().setColor(0xdd3e40)
                                .setTitle(`🚫  An issue occurred when adding ${target.displayName} to the ticket system. Please make of note of this and message <@490492567822008323>.`)
                            await interaction.reply({ embeds: [dbInitErr]});
                        }
                    }
                } else {
                    const noSupport = new EmbedBuilder()
                            .setAuthor({ name: `${target.displayName} (@${target.username})`, iconURL: target.displayAvatarURL()})
                            .setColor(0xdd3e40)
                            .setTitle(`🚫  ${target.displayName} is not a Supporter+.`)
                            .setDescription(`Only supporters are eligible to use tickets.`)
                        interaction.reply({ embeds: [noSupport]});
                }
             } else {
                    const noPerms = new EmbedBuilder().setColor(0xdd3e40).setTitle(`🚫  You can't use this command.`)
                    interaction.reply({ embeds: [noPerms]});
                }
        }
    }
})

client.login(token);