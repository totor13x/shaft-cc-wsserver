'use strict'

const UserOnline = use('App/Models/User/Online')
const Env = use('Env')

const moment = require('moment-timezone')

class OnlineController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }
  async onSave (data) {
    let online = new UserOnline
    online.user_id = data.user_id
    online.server_id = this.request.server.id
    online.start = moment(data.data.start)
      .utcOffset(data.zone, true)
      .tz(Env.get('TZ'))
      .format('YYYY-MM-DD HH:mm:ss')
    online.end = moment(data.data.last)
      .utcOffset(data.zone, true)
      .tz(Env.get('TZ'))
      .format('YYYY-MM-DD HH:mm:ss')
    online.data = data.data.sec
    await online.save()
  }
}

module.exports = OnlineController
