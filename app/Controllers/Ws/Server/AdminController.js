'use strict'

const SteamID = require('steamid')
const User = use('App/Models/User')
const Server = use('App/Models/Server')
const Redis = use('Redis')

class AdminController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }
  async onRefreshLocks (message) {
    let steamid = new SteamID(message)

    let user = await User
      .query()
      .with('locks')
      .where('steamid', steamid.getSteamID64())
      .first()

    if (user) {
      user = await user.toJSON()
      let locks = user.locks

      let output = {}

      locks.forEach(lock => {
        output[lock.type] = lock
      })

      this.socket.emit('refreshLocks', {
        // id: user.id,
        steamid: steamid.steam2(),
        locks: output
      })
    }
  }
  async onBanned (message) {
    let steamid = new SteamID(message)

    let user = await User
      .query()
      .with('locks')
      .where('steamid', steamid.getSteamID64())
      .first()

    if (user) {
      user = await user.toJSON()
      let locks = user.locks

      let output = {}

      locks.forEach(lock => {
        output[lock.type] = lock
      })

      this.socket.emit('banned', {
        // id: user.id,
        steamid: steamid.steam2(),
        locks: output
      })
    }
  }
}

module.exports = AdminController
