const { ioc } = require('@adonisjs/fold')
const _ = require('lodash')
const async = require('async')
const plural = require('plural-ru')

const Redis = use('Redis')
const Ws = use('Ws')
const Env = use('Env')

class PollDeleteChannel {
  static get key() {
    return "PollDeleteChannel-key";
  }

  async handle(job) {
	const bot = ioc.use('DiscordBot')
	
    let { data } = job;
	const channel_id = data.channel_id
	
	data = await Redis.get(`polls:${channel_id}`)
	if (data) {
		data = JSON.parse(data)
		const owner_id = '376434801680449536'
		let meInstance = bot.users.cache
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
				let instance = await bot.users.fetch(id)
					// .find(x => x.id === id)
					
				outputTwo += `${instance.tag} - ${text}` + "\n"
			})
			outputTwo += "```"
			
		// let insta
		// let meInstance = this.bot.users.cache
			// .find(x => x.id === owner_id)
			
			meInstance.send(`Итоги опроса: ${data.hash}
Тема опроса ${data.theme_name}
Опрос закрылся в ${data.time} по МСК.

**Сортировка по местам**
${outputOne}

**Опись каждого юзера**
${outputTwo}
`)

await Redis.del(`polls:${channel_id}`)
let channel = await bot.channels.fetch(channel_id)
		  // .find(x => x.id === owner_id)
channel.delete('Close the poll')
	}
	// const reason = data['0']
	// const minutes = data['1']
	// const member_id = data['member_id']
	
	// console.log(data)

  }
	}
}

module.exports = PollDeleteChannel;
