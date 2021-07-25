
const Redis = use('Redis')
const Ws = use('Ws')
const Env = use('Env')
const _ = require('async-dash')

const { MessageEmbed } = require('discord.js');

const Server = use('App/Models/Server')
const { ioc } = require('@adonisjs/fold')

class DiscordChannelServerOnline {
  static get key() {
    return "DiscordChannelServerOnline-key";
  }


  async handle(job) {
	  const bot = ioc.use('DiscordBot')
    let channel = bot.channels.cache.get(Env.get('BOT_GUILD_SERVER_INFO_CHANNEL'))
	// console.log(channel)
	let servers = await Server
		.query()
		.where('is_enabled', 1)
		.fetch()

	channel.messages.fetch()
		.then(async (messages) => {
			if (messages.size == 0)
			{
				channel.send("<3")
				.then(message => message.pin())
			}
			else
			{
				const embed = new MessageEmbed()
				embed.setTitle("Онлайн серверов")
				await _.asyncEach(servers.rows, async (data) => {
					const name = data.beautiful_name

					const players = await Redis.get(`ws:server:${data.id}:online:players`)
					const max_players = await Redis.get(`ws:server:${data.id}:online:max_players`)
					const ip = await Redis.get(`ws:server:${data.id}:online:ip`)
					if (players !== null && max_players !== null && ip !== null) {
						embed.addField(name, `${players}/${max_players} - ${ip}`, true)
					} else {
						embed.addField(name, 'Информация недоступна', true)
					}
					// embed.addField(id,`${l.player} - ${l.ip}`,true)
				})

				embed.setTimestamp(new Date())
				embed.setFooter("shaft.cc with 💓")
				messages.first().edit(embed)
			}
		})
  }
}
module.exports = DiscordChannelServerOnline;
