'use strict'

const SteamID = require('steamid')
const User = use('App/Models/User')

class LockController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }

  async onCheck (message) {
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

      this.socket.emit('checked', {
        // id: user.id,
        steamid: steamid.steam2(),
        locks: output
      })
    }
  }
}

module.exports = LockController
