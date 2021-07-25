'use strict'

// const SteamID = require('steamid')
const Log = use('App/Models/Core/Log')
const LogType = use('App/Models/Core/Log/Type')
const Database = use('Database')
const Ws = use('Ws')

const LogService = use('App/Services/LogService')
// const Attr = use('App/Models/Core/Log/Attr')

class LogsController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }

  async onTest (message) {
    if (this.request.server) {
      // let
      let log = new Log
      // let attrs =
      // console.log()
      if (message.attrs && message.attrs.user_ids && typeof message.attrs.user_ids != 'object' ) {
        message.attrs.user_ids = [ message.attrs.user_ids ]
      }
      log.attrs = message.attrs
      log.server_id = this.request.server.id
      log.type_id = message.type
      await log.save()

      let this_log = log.id

      this.onUpdateID(this_log)
    }
  }
  async onSyncAdminPanel (data) {
    const type = data.type
    const string = data.string

    let logtype = await LogType
      .query()
      .where('id', `admin_${type}`)
      .getCount()

    if (logtype == 0 ) {
      let newLogType = new LogType()

      newLogType.id = `admin_${type}`
      newLogType.string = string

      await newLogType.save()

      return
    }

  }
  async onUpdateID (id) {
    let data = await Log
      .query()
      .with('type')
      .with('server')
      .where('id', id)
      .first()
    data = await data.toJSON()
    data = await LogService.FormatArgs(data)

    const topic = Ws
      .getChannel('client/logs')
      .topic('client/logs')

    if (topic){
      topic.broadcast('new_log', data)
    }
  }
  async onTestCall (message) {
    let microtime = new Date()
    let data = await Database
      .raw("select * from logs where json_contains(attrs,'152494', '$.user_id');")

    console.log((new Date() - microtime)/1000 + ' sec')
  }
}

module.exports = LogsController
