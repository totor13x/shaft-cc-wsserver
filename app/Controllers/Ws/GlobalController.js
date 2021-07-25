'use strict'

const Redis = use('Redis')
const Ws = use('Ws')
class GlobalController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request

    this.onJoin()

    socket.on('close', () => {
      this.onLeave()
    })
  }
  async onJoin () {
    const request = this.request
    const socket = this.socket
    // console.log(socket.id)
    if (request.user) {
      await Redis.set(`ws:fds:${socket.connection.id}`, request.user.id)

      let userSockets = await Redis.smembers(`ws:user:${request.user.id}:count`)
      // console.log(userSockets)
      if (userSockets.length == 0) {
        await Redis.set(`ws:user:${request.user.id}:online`, 'online')


        const topic = Ws
          .getChannel('global')
          .topic('global')

        if (topic){
          topic.broadcast('user:online', {
            'user_id': request.user.id,
            'on': 'online'
          })
        }
      }
      this.socket.emit('user/device')
      await Redis.sadd(`ws:user:${request.user.id}:count`, socket.connection.id)
    }
  }
  async onLeave () {
    const request = this.request
    const socket = this.socket
    if (this.request.user) {
      await Redis.del(`ws:fds:${socket.connection.id}`)
      await Redis.srem(`ws:user:${request.user.id}:count`, socket.connection.id)

      let userSockets = await Redis.smembers(`ws:user:${request.user.id}:count`)

      if (userSockets.length != 0) {
        await Redis.set(`ws:user:${request.user.id}:online`, 'online')


        const topic = Ws
          .getChannel('global')
          .topic('global')

        if (topic){
          topic.broadcast('user:online', {
            'user_id': request.user.id,
            'on': 'online'
          })
          // this.socket.emit('user/device')
          let increase = []
          userSockets.forEach(id => {
            increase.push(`global#${id}`) // Потому что я нигде переменную не храню
          })
          // console.log(userSockets)
          topic.emitTo('user/device', 1, increase)
        }
      } else {
        await Redis.del(`ws:user:${request.user.id}:online`)

        const topic = Ws
          .getChannel('global')
          .topic('global')

        if (topic){
          topic.broadcast('user:online', {
            'user_id': request.user.id,
            'on': 'offline'
          })
        }
      }
    }
  }
  async onChangeDevice (device) {
    if (this.request.user) {
      await Redis.set(`ws:user:${this.request.user.id}:online`, device)

      const topic = Ws
        .getChannel('global')
        .topic('global')

      if (topic) {
        topic.broadcast('user:online', {
          'user_id': this.request.user.id,
          'on': device
        })
      }
    }
  }
}

module.exports = GlobalController
