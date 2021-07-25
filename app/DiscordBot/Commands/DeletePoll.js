const _ = require('lodash')
const async = require('async')
const plural = require('plural-ru')

const Bull = use('Rocketseat/Bull')
const Redis = use('Redis')
const Env = use('Env')
const PollDeleteChannel = use('App/Jobs/PollDeleteChannel')
const crypto = require('crypto')
const moment = require('moment')

class DeletePoll {
  constructor(bot, helper) {
    this.helper = helper
	this.bot = bot
    this.name = 'Delete Poll'
    this.description = 'Удаление опроса'
    this.commands = {
      deletepoll: {
        usage: '!deletepoll <poll_id>',
        function: 'Delete',
        description: 'List all available commands',
        permissions: [ 'ADMINISTRATOR' ]
      },
    }
  }
  
  
  async Delete (message, args) {
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
			Bull.add(PollDeleteChannel.key, {
				channel_id: data.channel_id
			})
		}
    });
	// console.log(keys)
  }
}

module.exports = DeletePoll
