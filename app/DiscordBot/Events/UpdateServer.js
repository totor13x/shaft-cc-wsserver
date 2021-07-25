
const { MessageEmbed } = require('discord.js');

const axios = require("axios");
const Env = use('Env')
const Redis = use('Redis')

const Server = use('App/Models/Server')

const _ = require('async-dash')

const Bull = use('Rocketseat/Bull')
const DiscordChannelServerOnline = use('App/Cron/DiscordChannelServerOnline')

class UpdateServer {
  constructor(bot, helper) {
    bot.on('ready', async () => {
		setTimeout(() => {
			Bull.add(DiscordChannelServerOnline.key, { bot }, {
			  repeat: {
				cron: '* * * * *',
			  }
			})
		}, 1000)
	})
  }
}

module.exports = UpdateServer
