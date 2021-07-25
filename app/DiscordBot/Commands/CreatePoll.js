const _ = require('lodash')
const async = require('async')
const plural = require('plural-ru')

const Bull = use('Rocketseat/Bull')
const Redis = use('Redis')
const Env = use('Env')
const PollDeleteChannel = use('App/Jobs/PollDeleteChannel')
const crypto = require('crypto')
const moment = require('moment')

class CreatePoll {
  constructor(bot, helper) {
    this.helper = helper
	  this.bot = bot
    this.name = 'Create Poll'
    this.description = 'Создание опроса'
	  this.category_name = '🖍 Текстовые каналы'
    this.commands = {
      createpoll: {
        usage: '!createpoll <reason> [minutes]',
        function: 'Create',
        description: 'List all available commands',
        permissions: [ 'ADMINISTRATOR' ]
      },
    }


    this.bot.on('message', (message) => {
		this.messageReceived(message)
	})
    this.bot.on('ready', () => {
      this.run(bot, helper)
    })
  }

  async run(bot, helper) {

	let guild = await this.bot.guilds.fetch(Env.get('BOT_GUILD_SERVE'), false, true)

	let category = guild.channels.cache
      .filter(chx => chx.type === "category")
      .find(x => x.name === this.category_name)

	if (category) {
		category = await category.fetch(true)
    } else {
		return
	}

	const keys = await Redis.keys('polls:*')
	keys.forEach( async (key, pos) => {
		let data = await Redis.get(key)

		if (!data.channel_id) {
			await Redis.del(key)
		}

		let channel = await guild.channels.cache
			.find(x => x.id === data.channel_id)

		if (!channel) {
			await Redis.del(key)
		}
	})

	let channels = guild.channels.cache
      .each(async x => {
        x = await x.fetch(true)
        if (x.parentID == category.id && x.type === "text" && x.name.startsWith('опрос')) {
          x.delete('Sync Polls after restart')
        }
      })
  }
  async messageReceived(message) {
	  // console.log(message.channel.name)
	  // console.log(message.)
	  const channel_id = message.channel.id

	  let data = await Redis.get(`polls:${channel_id}`)
	  if (data && message.author.id !== this.bot.user.id) {
		data = JSON.parse(data)
		  // console.log(message.channel.id)
		const text = message.content.toLowerCase().trim()
		const author_id = message.author.id

		message.delete()

		if (text == "") {
			return
		}

		let myMessage = await message.channel.messages
			.fetch({ limit: 10 })

		myMessage = await myMessage
			.find(x => x.author.id === this.bot.user.id)

		data.votes[author_id] = text
		let values = {}
		_.each(_.values(data.votes), (val) => {
			values[val] = values[val] || 0
			values[val]++
		})

		const sorted = _.orderBy(_.toPairs(values), 1, 'desc')

		await Redis.set(`polls:${channel_id}`, JSON.stringify(data))

		let output = "```"

		_.each(sorted, (val) => {
			output += `${val[0]} - ${plural(val[1], '%d голос', '%d голоса', '%d голосов')}` + "\n"
		})
		output += "```"
		myMessage.edit(`Опрос **#${data.hash}** свободной формы
Тема: ${data.theme_name}
Время: до ${data.time} по МСК.

Варианты:
${output}

> Для того, чтобы предложить вариант просто напишите слово в чат`)

		// Bull.add(PollDeleteChannel.key, {
			// channel_id: channel_id
		// })
		// }, {delay: 10000})
	}


  }
  async Create (message, args) {

	const reason = args['0']
	const minutes = args['1'] || 60
	const member_id = args['member_id']

	if (!reason) {
		return
	}

    const hash = crypto.randomBytes(3).toString('hex');

    let guild = await this.bot.guilds.fetch(Env.get('BOT_GUILD_SERVE'), false, true)

	let category = guild.channels.cache
      .filter(chx => chx.type === "category")
      .find(x => x.name === this.category_name)

	if (category) {
		category = await category.fetch(true)
    } else {
		return
	}

	// console.log(guild.channels.cache)
	// let channel = guild.channels.cache
      // .filter(chx => chx.type === "text")
      // .find(x => x.name === `Опрос #${hash}`)


	const channel = await guild.channels.create(`опрос-${hash}`, {
		type: 'text',
		parent: category.id,
		rateLimitPerUser: 60*60
    })

	// console.log(channel.id)

const theme_name = "`" + reason + "`"
const time = moment().add(minutes, 'm').format('DD.MM.YYYY HH:mm')

	await Redis.set(`polls:${channel.id}`, JSON.stringify({
		channel_id: channel.id,
		hash,
		reason,
		minutes,
		member_id,
		theme_name,
		time,
		votes: {}
	}))

channel.send(`Опрос **#${hash}**
Тема: ${theme_name}
Время: до ${time} по МСК.

Варианты:
Здесь еще пусто :c

> Для того, чтобы предложить вариант просто напишите слово в чат`)



	Bull.add(PollDeleteChannel.key, {
		channel_id: channel.id
	}, {delay: (minutes * 60) * 1000})
  }
}

module.exports = CreatePoll
