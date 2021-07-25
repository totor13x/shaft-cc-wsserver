'use strict'

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
    this.userService = new UserService
  }

  async onRequestSend (id) {
    let user = await this.userService.FindSockets(id)
    // FindSockets
    // console.log(user)
    let hash = crypto.randomBytes(5).toString('hex');


    Trades.push({
      id: hash,
      request: {
        id: this.request.user.id,
        username: '',
        status: false,
        items: []
      },
      respond: {
        id: id,
        username: '',
        status: false,
        items: []
      },
      status: 'request'
    })


    let increase = []
    user.sockets.forEach(id => {
      increase.push(`client/trade#${id}`)
    })

    const topic = Ws
      .getChannel('client/trade')
      .topic('client/trade')

    if (topic){
      topic.emitTo('requestSend', '123123', increase)
    }
  }

  async onRequestAccept (id) {
    let trade = Trades.find(data =>
      data.respond.id == this.request.user.id && data.status == 'request'
    )
    // console.log(Trades)
    // console.log(trade)
    if (trade) {

      let info = await this.onSocketTrade(trade)

      trade.respond.username = info.respond.class.username
      trade.request.username = info.request.class.username
      trade.status = 'accept'

      const logService = new LogService()

      logService.NewLog({
        attrs: {
          user_ids: [ trade.request.id, trade.respond.id ],
          id: trade.id
        },
        server_id: 1,
        type_id: 'trade_created'
      })

      const topic = Ws
        .getChannel('client/trade')
        .topic('client/trade')

      if (topic){
        topic.emitTo('requestAccept', trade, info.increase)
      }
    }
  }

  async onChat ({ id, text }) {
    let trade = Trades.find(data =>
      data.id == id && data.status == 'accept'
    )

    if (trade) {
      let info = await this.onSocketTrade(trade)

      let user = this.request.user.id == trade.respond.id && trade.respond || trade.request

      const logService = new LogService()

      logService.NewLog({
        attrs: {
          user_ids: [ user.id ],
          id: trade.id,
          text: text
        },
        server_id: 1,
        type_id: 'trade_chat'
      })

      const topic = Ws
        .getChannel('client/trade')
        .topic('client/trade')

      if (topic){
        topic.emitTo('chat', { user: user, text: text }, info.increase)
      }
    }
  }

  async onMoveItem ({ id, perm_id, type }) {
    let trade = Trades.find(data =>
      data.id == id && data.status == 'accept'
    )

    if (trade) {
      let user = this.request.user.id == trade.respond.id && trade.respond || trade.request
      let whoUpdate = this.request.user.id == trade.respond.id && 'respond' || 'request'

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
        user_id: this.request.user.id,
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

      let info = await this.onSocketTrade(trade)

      const topic = Ws
        .getChannel('client/trade')
        .topic('client/trade')

      if (topic){
        topic.emitTo('moveItem', data, info.increase)
      }

      await this.onUpdateStatus(trade)
      // console.log(user, perm_id, item)
    }
  }
  async onChangeStatus ({ id, status }) {
    let trade = Trades.find(data =>
      data.id == id && data.status == 'accept'
    )

    if (trade) {
      let whoUpdate = this.request.user.id == trade.respond.id && 'respond' || 'request'
      let opposite = whoUpdate == 'request' && 'respond' || 'request'

      trade[whoUpdate].status = status ? 'accept' : false

      await this.onUpdateStatus(trade)
    }
  }
  async onReady ({ id, status }) {
    let trade = Trades.find(data =>
      data.id == id && data.status == 'accept'
    )

    if (trade) {
      let whoUpdate = this.request.user.id == trade.respond.id && 'respond' || 'request'
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

      item.pointshop_id = inv.id
      await item.save()
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

      item.pointshop_id = inv.id
      await item.save()
    }

    const topic = Ws
      .getChannel('server/poitshop')
      .topic('server/poitshop')

    if (topic){
      topic.broadcast('forceGetItems', [
        trade.respond.id,
        trade.request.id
      ])
    }

    await this.onClose(trade.id, {
      reason: 'Обмен завершен',
      type: 3
    })
    // console.log(PointshopClass)
  }
  async onClose (id, reason) {
    let trade = Trades.find(data =>
      data.id == id && data.status == 'accept'
    )

    if (trade) {
      let info = await this.onSocketTrade(trade)

      let ToReason = ''
      let ToType = 0

      if (this.request.user) {
        let user = this.request.user.id == trade.respond.id && trade.respond || trade.request
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

      const logService = new LogService()

      logService.NewLog({
        attrs: {
          user_ids: [ trade.request.id, trade.respond.id ],
          id: trade.id,
          reason: ToReason
        },
        server_id: 1,
        type_id: 'trade_closed'
      })

      const topic = Ws
        .getChannel('client/trade')
        .topic('client/trade')

      if (topic){
        topic.emitTo('notify', { text: ToReason, type: ToType }, info.increase)
        topic.emitTo('close', true, info.increase)
      }

      Trades = Trades.filter(trad => trad.id !== trade.id)
    }
  }

  async onUpdateStatus (trade) {

    let info = await this.onSocketTrade(trade)

    const topic = Ws
      .getChannel('client/trade')
      .topic('client/trade')

    if (topic){
      topic.emitTo('updateStatus', trade, info.increase)
    }
  }
  async onSocketTrade (trade) {
    let increase = []
    let respond = await this.userService.FindSockets(trade.respond.id)
    respond.sockets.forEach(id => {
      increase.push(`client/trade#${id}`)
    })
    let request = await this.userService.FindSockets(trade.request.id)
    request.sockets.forEach(id => {
      increase.push(`client/trade#${id}`)
    })
    return {
      respond: respond,
      request: request,
      increase: increase
    }
  }
}

module.exports = TradeController
