'use strict'

const User = use('App/Models/User')
const UserService = use('App/Services/UserService')
const UserPointshopItem = use('App/Models/User/Pointshop/PointshopItem')
const UserPointshop = use('App/Models/User/Pointshop')
const Ws = use('Ws')
const crypto = require('crypto')
const _ = require('lodash')

const LogService = use('App/Services/LogService')
const PointshopClass = use('App/Controllers/Ws/Server/PointshopController')

let Trades = []

class TradeController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
    // this.userService = new UserService
  }

  async onRequestSend (data) {
	  console.log(data)
    const request_id = data.request_id
    const respond_id = data.respond_id
    // let user = await UserService.FindSockets(id)
    let hash = crypto.randomBytes(5).toString('hex');

	console.log(request_id, respond_id)
    Trades.push({
      id: hash,
      request: {
        id: request_id,
        username: '',
        status: false,
        items: []
      },
      respond: {
        id: respond_id,
        username: '',
        status: false,
        items: []
      },
      status: 'request'
    })

    this.socket.emit('requestSend', {
      hash: hash,
      request_id: request_id,
      respond_id: respond_id
    })


    setTimeout(() => {
      let trade = Trades.find(data =>
        data.id == hash && data.status == 'request'
      )
      if (trade) {
        Trades = Trades.filter(trad => trad.id !== trade.id)
        this.socket.emit('removeHash', {
          request_id: request_id,
          respond_id: respond_id
        })
      }
    }, 10 * 1000);
  }


  async onRequestAccept (res_id) {
    let trade = Trades.find(data =>
      data.respond.id == res_id &&
      data.status == 'request'
    )

    if (trade) {
      let info = await this.onSocketTrade({
        request_id: trade.request.id,
        respond_id: trade.respond.id
      })

      trade.respond.username = info.respond.username
      trade.request.username = info.request.username
      trade.status = 'accept'

      // const logService = new LogService()

      LogService.NewLog({
        attrs: {
          user_ids: [ trade.request.id, trade.respond.id ],
          id: trade.id
        },
        server_id: this.request.server.id,
        type_id: 'trade_created'
      })

      this.socket.emit('requestAccept', {
        request_id: trade.request.id,
        respond_id: trade.respond.id,
        trade: trade
      })
      // const topic = Ws
      //   .getChannel('client/trade')
      //   .topic('client/trade')

      // if (topic){
      //   topic.emitTo('requestAccept', trade, info.increase)
      // }
    }
  }
  async onRequestCancel (res_id) {
    let trade = Trades.find(data =>
      data.respond.id == res_id &&
      data.status == 'request'
    )

    if (trade) {
      Trades = Trades.filter(trad => trad.id !== trade.id)
      this.socket.emit('removeHash', {
        request_id: trade.request.id,
        respond_id: trade.respond.id
      })
    }
  }

  async onChat ({ id, user_id, text }) {
    console.log(id, user_id, text)
    let trade = Trades.find(data =>
      data.id == id && data.status == 'accept'
    )

    if (trade) {
      // let info = await this.onSocketTrade({
      //   request_id: trade.request.id,
      //   respond_id: trade.respond.id
      // })

      let user = user_id == trade.respond.id && trade.respond || trade.request

      // const logService = new LogService()

      LogService.NewLog({
        attrs: {
          user_ids: [ user.id ],
          id: trade.id,
          text: text
        },
        server_id: 1,
        type_id: 'trade_chat'
      })

      this.socket.emit('chat', {
        request_id: trade.request.id,
        respond_id: trade.respond.id,
        username: user.username,
        text: text
      })
    }
  }


  async onMoveItem ({ id, user_id, perm_id, type }) {
    let trade = Trades.find(data =>
      data.id == id && data.status == 'accept'
    )

    if (trade) {
      let user = user_id == trade.respond.id && trade.respond || trade.request
      let whoUpdate = user_id == trade.respond.id && 'respond' || 'request'

      let item = await UserPointshopItem
        .query()
        .with('pointshop.user')
        .with('pointshop_item')
        .where('id', perm_id)
        .first()

      item = await item.toJSON()

      // TODO: Проверка на существование предмета
      // TODO: Проверка на возможность передачи предмета

      trade.respond.status = false
      trade.request.status = false

      let data = {
        user_id: user_id,
        item_id: item.item_id,
        perm_id: item.id,
        type: type
      }

      if (type == 'sharemyinv') {
        trade[whoUpdate].items.push(data)
      } else if (type == 'myinv') {
        trade[whoUpdate].items = trade[whoUpdate].items
          .filter(trad => trad.perm_id !== data.perm_id)
      }

      this.socket.emit('moveItem', {
        request_id: trade.request.id,
        respond_id: trade.respond.id,
        user_id: user_id,
        item_id: item.item_id,
        perm_id: item.id,
        type: type
      })
      // let info = await this.onSocketTrade(trade)

      // const topic = Ws
      //   .getChannel('client/trade')
      //   .topic('client/trade')

      // if (topic){
      //   topic.emitTo('moveItem', data, info.increase)
      // }

      await this.onUpdateStatus(trade)
      // console.log(user, perm_id, item)
    }
  }

  async onChangeStatus ({ id, user_id, status }) {
    let trade = Trades.find(data =>
      data.id == id && data.status == 'accept'
    )

    if (trade) {
      let whoUpdate = user_id == trade.respond.id && 'respond' || 'request'
      let opposite = whoUpdate == 'request' && 'respond' || 'request'

      trade[whoUpdate].status = status ? 'accept' : false

      await this.onUpdateStatus(trade)
    }
  }

  async onReady ({ id, user_id, status }) {
    let trade = Trades.find(data =>
      data.id == id && data.status == 'accept'
    )

    if (trade) {
      let whoUpdate = user_id == trade.respond.id && 'respond' || 'request'
      let opposite = whoUpdate == 'request' && 'respond' || 'request'

      trade[whoUpdate].status = status ? 'ready' : false

      await this.onUpdateStatus(trade)

      if (trade[whoUpdate].status == 'ready' && trade[opposite].status == 'ready') {
        trade.interval_count = 6
        let self = this
        trade.interval = setTimeout( async function run() {
          // func(i);
          if (!trade.interval_count) {
            clearTimeout(trade.interval)
            return
          }

          if (trade[whoUpdate].status != 'ready' || trade[opposite].status != 'ready') {
            clearTimeout(trade.interval)
            return
          }

          trade.interval_count--

          await self.onUpdateStatus(trade)

          console.log(trade.interval_count)
          if (trade.interval_count <= 0) {
            clearTimeout(trade.interval)
            self.Finish(trade)
            return
          }

          setTimeout(await run, 1000);
        }, 1000)
      } else {
        clearTimeout(trade.interval)
        delete trade.interval
        delete trade.interval_count
        await this.onUpdateStatus(trade)
      }
    }
  }

  async Finish (trade) {
    const topic = Ws
      .getChannel('server/pointshop')
      .topic('server/pointshop')
    // console.log(trade.respond.items)
    // console.log(trade.request.items)

    // Запрос на получение предметов
    // отправителя трейда (request)
    let RequestPointshop = await UserPointshopItem
      .query()
      .with('pointshop')
      .whereIn('id', _.map(trade.request.items, 'perm_id'))
      .fetch()

    // Передача предметов отправителя (request)
    // получателю (response)
    for (let item of RequestPointshop.rows) {
      let pointshop = item.getRelated('pointshop')

      let inv = await UserPointshop
        .findOrCreate({
          user_id: trade.respond.id,
          server_id: pointshop.server_id
        })
	    item.data = {}
      item.pointshop_id = inv.id
      await item.save()

      topic.broadcast('holsterItem', {
        user_id: trade.request.id,
        perm_id: item.id
      })

    }

    // Запрос на получение предметов
    // получателя трейда (response)
    let RespondPointshop = await UserPointshopItem
      .query()
      .with('pointshop')
      .whereIn('id', _.map(trade.respond.items, 'perm_id'))
      .fetch()

    // Передача предметов получателя (response)
    // отправителю (request)
    for (let item of RespondPointshop.rows) {
      let pointshop = item.getRelated('pointshop')

      let inv = await UserPointshop
        .findOrCreate({
          user_id: trade.request.id,
          server_id: pointshop.server_id
        })

	    item.data = {}
      item.pointshop_id = inv.id
      await item.save()

      topic.broadcast('holsterItem', {
        user_id: trade.respond.id,
        perm_id: item.id
      })
    }


    if (topic){
		setTimeout(() => {
		  topic.broadcast('forceGetItems', [
			trade.respond.id,
			trade.request.id
		  ])
		}, 1000)
    }

    await this.onClose(
      {
        id: trade.id,
      },
      {
        reason: 'Обмен завершен',
        type: 3
      }
    )
    // console.log(PointshopClass)
  }

  async onClose (data, reason) {
    let trade = Trades.find(trad =>
      trad.id == data.id && trad.status == 'accept'
    )

    if (trade) {
      // let info = await this.onSocketTrade(trade)

      let ToReason = ''
      let ToType = 0

      if (data.user_id) {
        let user = data.user_id == trade.respond.id && trade.respond || trade.request
        ToReason = user.username + ' отменил обмен'
        ToType = 1
      }

      if (reason) {
        if (reason.reason) {
          ToReason = reason.reason
        }
        if (reason.type) {
          ToType = reason.type
        }
      }

        clearTimeout(trade.interval)
        delete trade.interval
        delete trade.interval_count
      // const logService = new LogService()

      LogService.NewLog({
        attrs: {
          user_ids: [ trade.request.id, trade.respond.id ],
          id: trade.id,
          reason: ToReason
        },
        server_id: this.request.server.id,
        type_id: 'trade_closed'
      })

      this.socket.emit('notify', {
        request_id: trade.request.id,
        respond_id: trade.respond.id,
        text: ToReason,
        type: ToType
      })

      this.socket.emit('removeHash', {
        request_id: trade.request.id,
        respond_id: trade.respond.id
      })

      this.socket.emit('close', {
        request_id: trade.request.id,
        respond_id: trade.respond.id
      })
      // this.socket.emit('close', {

      // })
      // const topic = Ws
      //   .getChannel('client/trade')
      //   .topic('client/trade')

      // if (topic){
      //   topic.emitTo('notify', { text: ToReason, type: ToType }, info.increase)
      //   topic.emitTo('close', true, info.increase)
      // }

      Trades = Trades.filter(trad => trad.id !== trade.id)
    }
  }

  async onUpdateStatus (trade) {
    this.socket.emit('updateStatus', {
      request_id: trade.request.id,
      respond_id: trade.respond.id,
      trade: trade
    })
    // let info = await this.onSocketTrade(trade)

    // const topic = Ws
    //   .getChannel('client/trade')
    //   .topic('client/trade')

    // if (topic){
    //   topic.emitTo('updateStatus', trade, info.increase)
    // }
  }

  async onSocketTrade ({ respond_id, request_id }) {
    let respond = await User.find(respond_id)
    let request = await User.find(request_id)
    // let increase = []
    // let respond = await UserService.FindSockets(trade.respond.id)
    // respond.sockets.forEach(id => {
    //   increase.push(`client/trade#${id}`)
    // })
    // let request = await UserService.FindSockets(trade.request.id)
    // request.sockets.forEach(id => {
    //   increase.push(`client/trade#${id}`)
    // })
    return {
      respond: respond,
      request: request
    }
  }
}
module.exports = TradeController
