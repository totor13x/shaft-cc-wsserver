'use strict'

const Server = use('App/Models/Server')
const Redis = use('Redis')
const workshop_ids = {
  2: { // Murder
    low: '2536701604',
    hd: '2536705879',
  },
  3: { // Deathrun
    low: '2536698778',
    hd: '2536703966',
  }
}
class GlobalController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request

    this.socket.emit('open')

    socket.on('close', () => {
      this.onLeave()
    })
  }

  async onAuth (message) {
    if (this.request.server) {
      this.socket.emit('auth', await this.request.server.toJSON())

      await Redis.set(`ws:server:${this.request.server.id}`, this.socket.connection.id)
    }
  }

  async onLeave () {
    if (this.request.server) {
      await Redis.del(`ws:server:${this.request.server.id}`)
    }
  }
  
  async onOnlinePlayers (data) {
	  if (this.request.server) {
      const server_id = this.request.server.id
		  await Redis.set(`ws:server:${server_id}:online:workshop`, JSON.stringify(workshop_ids[server_id]))
      await Redis.set(`ws:server:${server_id}:online:players`, data.players)
      await Redis.set(`ws:server:${server_id}:online:max_players`, data.max_players)
      await Redis.set(`ws:server:${server_id}:online:ip`, data.ip)
	  }
  }
}

module.exports = GlobalController
