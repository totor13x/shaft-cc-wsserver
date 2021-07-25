'use strict'

const _ = require('lodash')

const User = use('App/Models/User')
const UserPointshop = use('App/Models/User/Pointshop')
const Redis = use('Redis')
const Ws = use('Ws')
const Env = use('Env')

class UserService {
  user = null

  static async LoadUserInstance (user_id) {
    if (!this.user) {
      this.user = await User.find(user_id)
    }
  }

  async FindSockets (user_id) {
    await this.LoadUserInstance(user_id)
    let userSockets = await Redis.smembers(`ws:user:${user_id}:count`)
    // let userClass = await User.find(id)
    // console.log(userSockets)
    return {
      class: this.user,
      sockets: userSockets
    }
  }
  static async FindSocketsOnly (user_id) {
    // await this.LoadUserInstance(user_id)
    let userSockets = await Redis.smembers(`ws:user:${user_id}:count`)
    // let userClass = await User.find(id)
    // console.log(userSockets)
    return userSockets
  }
  
  static async notifySite (user_id, data) {
    let userSockets = await Redis.smembers(`ws:user:${user_id}:count`)
    // console.log(userSockets)
    if (userSockets.length != 0) {
      // await Redis.set(`ws:user:${request.user.id}:online`, 'online')

      let socks = _.map(userSockets, (socket) => `global#${socket}`)
      const topic = Ws
        .getChannel('global')
        .topic('global')

      if (topic){
        topic.emitTo('user:notify', data, socks)
      }
    }
  }
  static async notifyAllServers(user_id, data) {
    const topic = Ws
      .getChannel('server/global')
      .topic('server/global')

    if (topic){
      topic.broadcast('notifyUser', {
        user_id: user_id,
        message: data.message || null,
        type: data.type || null,
        length: data.length || null
      })
    }
  } 
  static async notifyOnServer (user_id, server_id, data) {

    // local ply = UserIDToPlayer(data.user_id)
    // if IsValid(ply) then
    //   netstream.Start(ply, 'TTS::Notification', {
    //     text = data.message or '',
    //     type = data.type or NOTIFY_GENERIC,
    //     length = data.length or 8
    //   })
    // end

    let socket = await Redis.get(`ws:server:${server_id}`)

    const topic = Ws
      .getChannel('server/global')
      .topic('server/global')

    if (topic){
      topic.emitTo('notifyUser', {
        user_id: user_id,
        message: data.message || null,
        type: data.type || null,
        length: data.length || null
      }, [
        `server/global#${socket}`
      ])
    }
  }
  static async updateInventoryCount (user_id, server_id) {
    await this.LoadUserInstance(user_id)

    // let user = await User.find(user_id)

    let inventoryCount = await this.user
      .inventory()
      .getCount()

    let socket = await Redis.get(`ws:server:${server_id}`)

    const topic = Ws
      .getChannel('server/inventory')
      .topic('server/inventory')

    if (topic){
      topic.emitTo('countInventory', {
        user_id: user_id,
        max: Env.get('USER_INVENTORY_LIMIT'),
        count: inventoryCount,
      }, [
        `server/inventory#${socket}`
      ])
    }
  }
  static async UpdatePoints (user_id, server_id) {
    // console.log(this)
    // await this.LoadUserInstance(user_id)

    let user_pointshop = await UserPointshop
      .findOrCreate({
        user_id: user_id,
        server_id: server_id
      })

    let socket = await Redis.get(`ws:server:${server_id}`)

    const topic = Ws
      .getChannel('server/pointshop')
      .topic('server/pointshop')

    if (topic){
      topic.emitTo('points', {
        user_id: user_id,
        points: user_pointshop.points
      }, [
        `server/pointshop#${socket}`
      ])
    }
    // console.log(this.user, ' - user')
  }
  static async UpdateTTSBalance (user_id) {
    // console.log(this)
    await this.LoadUserInstance(user_id)

    // let user_pointshop = await UserPointshop
    //   .findOrCreate({
    //     user_id: user_id,
    //     server_id: server_id
    //   })

    // let socket = await Redis.get(`ws:server:${server_id}`)

    const topic = Ws
      .getChannel('users')
      .topic('users')

    
    if (topic) {
      const tts_balance = await this.user.tts_balance()
      topic.broadcast('ttsBalance', {
        steamid: this.user.steamid,
        balance: tts_balance
      })
    }
    // console.log(this.user, ' - user')
  }
}

module.exports = UserService
