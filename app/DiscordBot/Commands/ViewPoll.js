const _ = require('lodash')
const async = require('async')
const plural = require('plural-ru')

const Bull = use('Rocketseat/Bull')
const Redis = use('Redis')
const Env = use('Env')
const PollDeleteChannel = use('App/Jobs/PollDeleteChannel')
const crypto = require('crypto')
const moment = require('moment')

class ViewPoll {
  constructor(bot, helper) {
    this.helper = helper
	this.bot = bot
    this.name = 'Delete Poll'
    this.description = 'Превью опроса'
    this.commands = {
      viewpoll: {
        usage: '!viewpoll <poll_id>',
        function: 'View',
        description: 'List all available commands',
        permissions: [ 'ADMINISTRATOR' ]
      },
    }
  }
  
  
  async View (message, args) {
	const pollId = args['0']
	if (!pollId || pollId == '') {
		return 
	}
	// console.log(pollId)
	const keys = await Redis.keys('polls:*')
	keys.forEach( async (key, pos) => {
		let data = await Redis.get(key)
		data = JSON.parse(data)
		
		if (data.hash == pollId) {
		const owner_id = message.author.id
		let meInstance = this.bot.users.cache
		  .find(x => x.id === owner_id)
		  
		if (meInstance) {
			
			// data.votes[author_id] = text
			let values = {}
			_.each(_.values(data.votes), (val) => {
				values[val] = values[val] || 0
				values[val]++
			})
			
			const sorted = _.orderBy(_.toPairs(values), 1, 'desc')
			
			let outputOne = "```"
			_.each(sorted, (val) => {
				outputOne += `${val[0]} - ${plural(val[1], '%d голос', '%d голоса', '%d голосов')}` + "\n"
			})
			outputOne += "```"
			
			let outputTwo = "```"
			// __.asyncEach(data.votes, async (text, id) => {
			await async.forEachOf(data.votes, async (text, id, callback) => {
			// for(let iKey in obj) {
        // obj[iKey] = await fn(obj[iKey]);
    // }
				// console.log(text, id)
				let instance = await this.bot.users.fetch(id)
					// .find(x => x.id === id)
					
				outputTwo += `${instance.tag} - ${text}` + "\n"
			})
			outputTwo += "```"
			
		// let insta
		// let meInstance = this.bot.users.cache
			// .find(x => x.id === owner_id)
			
			meInstance.send(`Превью опроса: ${data.hash}
Тема опроса ${data.theme_name}
Опрос закроется в ${data.time} по МСК.

**Сортировка по местам**
${outputOne}

**Опись каждого юзера**
${outputTwo}
`)	
		}
		}		
    });
	// console.log(keys)
  }
}

module.exports = ViewPoll
