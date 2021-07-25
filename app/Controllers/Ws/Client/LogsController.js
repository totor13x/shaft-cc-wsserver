'use strict'
const Database = use('Database')
const Log = use('App/Models/Core/Log')
const LogType = use('App/Models/Core/Log/Type')
const User = use('App/Models/User')
const Server = use('App/Models/Server')
const Redis = use('Redis')

const LogService = use('App/Services/LogService')
const crypto = require('crypto')

class LogsController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
    this.onJoin()
  }
  async onJoin () {
	  // console.log(!await this.request.user.hasPermissionTo('ap-logs'))
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-logs'))) {
			this.socket.close()
			return
		}
	} else {
		this.socket.close()
		return
	}
    let servers = await Server
      .query()
      .setHidden(['api_token','created_at','updated_at'])
      .fetch()

    servers = servers.toJSON()
    let servers_format = {}
    servers.forEach(server => {
      server.name = server.beautiful_name
      servers_format[server.id] = server
    })
    // console.log(object)

    let types = await LogType
      .all()

    types = await types.toJSON()
    let log_format = {}
    let admin_format = {}
    types.forEach(type => {
      type.name = type.name != null ? type.name : type.id
      if (type.id.search('admin_') === -1) {
        log_format[type.id] = type
      } else {
        admin_format[type.id] = type
      }
    })

    this.socket.emit('filterList', [
      {
        type: 'servers',
        title: 'Сервера',
        options: servers_format
      },
      {
        type: 'types',
        title: 'Типы данных',
        text: 'Не заполнено еще',
        options: log_format
      },
      {
        type: 'admin_types',
        title: 'TTS:ADM',
        options: admin_format
      }
    ])
  }
  async onLogList (filter) {
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-logs'))) {
			return
		}
	} else {
		return
	}
    // console.log('123')
    // const logService = new LogService()
    let microtime = new Date()

    let data = Log
      .query()
      .with('type')
      .with('server')

    if (filter.servers.length > 0) {
      data
        .whereIn('server_id', filter.servers)
    }
    filter.types = [...new Set(filter.types), ...new Set(filter.admin_types)] // Это очень тупо, знаю
    if (filter.types.length > 0) {
      data
        .whereIn('type_id', filter.types)
    }


    data = await data
      .limit(30)
      .orderBy('id', 'desc')
      .fetch()

    data = await data.toJSON()

    let new_data = await Promise.all(data.map(async (log) => {
      return await LogService.FormatArgs(log)
    }))

    console.log((new Date() - microtime)/1000 + ' sec')
    this.socket.emit('logList', new_data)
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
    this.socket.emit('new_log', data)
  }
  async onTestCall (message) {
    let microtime = new Date()
    let data = await Database
      .raw("select * from logs where json_contains(attrs,'152494', '$.user_id');")

    console.log((new Date() - microtime)/1000 + ' sec')
  }

  async onTypeList () {
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-logs-types'))) {
			return
		}
	} else {
		return
	}

    let types = await LogType
      .all()

    types = await types.toJSON()
    this.socket.emit('typeList', types)
  }
  async onTypeNew (data) {
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-logs-types'))) {
			return
		}
	} else {
		return
	}
    let type = new LogType
    type.id = data
    type.name = crypto.randomBytes(3).toString('hex')
    type.string = crypto.randomBytes(3).toString('hex')
    await type.save()

    // TODO: Уведомление о создании
    this.socket.emit('typeUpdate')
  }
  async onTypeSave (data) {
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-logs-types'))) {
			return
		}
	} else {
		return
	}
    let type = await LogType
      .query()
      .where('id', data.id)
      .first()
    console.log(data)
    type.name = data.name
    type.string = data.string
    await type.save()
    // TODO: Уведомление об сохранении
    // this.socket.emit('typeList', types)
  }
  async onTypeDelete (data) {
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-logs-types'))) {
			return
		}
	} else {
		return
	}
    await LogType
      .query()
      .where('id', data)
      .delete()

      // TODO: Уведомление об удалении
    this.socket.emit('typeUpdate')
  }
}

module.exports = LogsController
