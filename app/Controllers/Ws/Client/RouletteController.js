'use strict'


// TODO: При разработке возможности открытия кейсов с сайта,
// нужно учесть, что метод changePoints и поинты передаются только
// на текущий сервер.

const UserCrate = use('App/Models/User/Crate')
const UserPointshop = use('App/Models/User/Pointshop')
const Crate = use('App/Models/Economy/Crate')
const Tag = use('App/Models/Economy/Tag')
const Redis = use('Redis')
const Ws = use('Ws')

const _ = require('lodash')

const TTSItem = use('App/Models/Economy/TTS/TTSItem')
const PointshopItem = use('App/Models/Economy/Pointshop/PointshopItem')

const getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Надо убрать лишние данные из кейсов
const json_output = (item) => {
  let name = item.id

  if (item.itemable && item.itemable.name) {
    name = item.itemable.name
  }
  return {
    name: name
  }
}

let spinTest = null
let crateTest = {}
class RouletteController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }

  // TODO: Перенести код куда нибудь в нормальное место
  async changePoints(data) {
    // console.log(data)
    let user_pointshop = await UserPointshop
      .findOrCreate({
        user_id: data.user_id,
        server_id: data.server_id
      })

    user_pointshop.points += data.points
    await user_pointshop.save()

    let socket = await Redis.get(`ws:server:${data.server_id}`)
    // let increase = []
    // user.sockets.forEach(id => {
    //   increase.push(`client/trade#${id}`)
    // })
    console.log(socket, 'ws socket')
    const topic = Ws
      .getChannel('server/pointshop')
      .topic('server/pointshop')

    if (topic){
      topic.emitTo('points', {
        user_id: data.user_id,
        points: user_pointshop.points
      }, [
        `server/pointshop#${socket}`
      ])
    }
    // this.socket.emit('points', {
    //   user_id: data.user_id,
    //   points: user_pointshop.points
    // })
  }
  async onCrateList (server_id) {
    let crates = await Crate
      .query()
      .setHidden(['created_at', 'updated_at', 'hoci'])
      // .where()
      .fetch()
    // console.log(server_id, '---------serv')
    if (server_id) {
      // crates.rows.forEach(async (crate, id) => {
      for (let crate of crates.rows) {
        // let user = this.request.user
        // console.log(crate)
        let data = await UserCrate
          .findOrCreate(
            { user_id: this.request.user.id, crate_id: crate.id, server_id: server_id },
            { user_id: this.request.user.id, crate_id: crate.id, server_id: server_id }
          )
        crate.data = data
      }
    }

    crates = await crates.toJSON()

    this.socket.emit('crateList', crates)
  }

  async onCrateOpen ({ id, limit, server_id }) {
    let microtime = new Date()

    let historyRaw = await this.request.user
      .crate_histories()
      .with('item', (builder) => {
        builder.with('itemable', (builder) => {
          console.log(server_id)
          if (server_id) {
            builder
              .whereHas('servers', (builder) => {
                builder.where('server_id', server_id)
              }, '>', 0)
          }
        })
      })
      .limit(limit || 10)
      .orderBy('id', 'desc')
      .fetch()

    historyRaw = await historyRaw.toJSON()
    let history = []
    // console.log(historyRaw)
    historyRaw.forEach(item => {
      // console.log(item)
      history.push({
        ...json_output(item.item),
        created_at: item.created_at
      })
    })

    let crate = await Crate
      .query()
      .with('items.itemable.servers')
      .where('id', id)
      .first()

    crate = await crate.toJSON()

    if (server_id) {
      crate.items = _.filter(crate.items, (item) => {
        return _.some(item.itemable.servers, { id: server_id })
      })
    }
    // crate.items = dataItems

    let items = []
    // console.log(historyRaw)
    crate.items.forEach(item => {
      // console.log(item)
      items.push({
        ...json_output(item),
        change: item.change
      })
    })
    crate.items = items

    let data = await UserCrate
      .findOrCreate(
        { user_id: this.request.user.id, crate_id: id, server_id: server_id },
        { user_id: this.request.user.id, crate_id: id, server_id: server_id }
      )

    this.socket.emit('crateOpen', {
      crate: crate,
      data: data,
      history: history,
      mctime: (new Date() - microtime)/1000 + ' sec'
    })
  }
  async onBuy ({ id, server_id, type, count }) {
    let microtime = new Date()
    // console.log(id, server_id, type)
    count = count || 1

    let buy_type = ''

    if (type == 'keys') {
      buy_type = 'buy_key'
    }
    if (type == 'cases') {
      buy_type = 'buy_case'
    }

    console.log(buy_type, 'buy_type')
    let crate = await Crate.find(id)

    let user_pointshop = await UserPointshop
      .findOrCreate({
        user_id: this.request.user.id,
        server_id: server_id
      })

      // user_pointshop.points += data.points
    // 2000 > 1000 * 5
    if (user_pointshop.points < (count * crate[buy_type]) ) {
      // TODO: Return notify user
      console.log('Nedostatochno points')
      return
    }

    let data = await UserCrate
      .findOrCreate(
        { user_id: this.request.user.id, crate_id: id, server_id: server_id },
        { user_id: this.request.user.id, crate_id: id, server_id: server_id }
      )

    data[type] = data[type] + count
    data.save()

    // console.log(crate[buy_type])

    await this.changePoints({
      user_id: this.request.user.id,
      server_id: server_id,
      points: -(crate[buy_type] * count)
    })

    this.socket.emit('updateData', {
      data: data,
      mctime: (new Date() - microtime)/1000 + ' sec'
    })
  }
  async onSell ({ id, server_id, type }) {
    let microtime = new Date()

    let sell_type = ''

    if (type == 'keys') {
      sell_type = 'sell_key'
    }
    if (type == 'cases') {
      sell_type = 'sell_case'
    }

    let crate = await Crate.find(id)

    // let user_pointshop = await UserPointshop
    //   .findOrCreate({
    //     user_id: this.request.user.id,
    //     server_id: server_id
    //   })

    console.log(id, server_id, type)
    let data = await UserCrate
      .findOrCreate(
        { user_id: this.request.user.id, crate_id: id, server_id: server_id },
        { user_id: this.request.user.id, crate_id: id, server_id: server_id }
      )

    if (data[type] <= 0) {
      return
    }

    data[type]--
    data.save()


    await this.changePoints({
      user_id: this.request.user.id,
      server_id: server_id,
      points: crate[sell_type]
    })

    this.socket.emit('updateData', {
      data: data,
      mctime: (new Date() - microtime)/1000 + ' sec'
    })
  }
  async onCrateSpin ({ id, server_id }) {
    let microtime = new Date()

    let data = await UserCrate
      .findOrCreate(
        { user_id: this.request.user.id, crate_id: id, server_id: server_id },
        { user_id: this.request.user.id, crate_id: id, server_id: server_id }
      )
    if (data.cases <= 0 || data.keys <= 0) {
      return
    }

    let crate
    // TODO: Redis cache
    if (crateTest[id] == null) {
      // crate = await Crate
      //   .query()
      //   .with('items', (builder) => {
      //     builder.with('itemable')

      //     if (server_id) {
      //       builder
      //         .whereHas('itemable', (builder) => {
      //           builder
      //             .whereHas('servers', (builder) => {
      //               builder.where('server_id', server_id)
      //             }, '>', 0)
      //         }, '>', 0)
      //     }
      //   })
      //   .where('id', id)
      //   .first()
      // crate = await crate.toJSON()


      crate = await Crate
        .query()
        .with('items.itemable.servers')
        .where('id', id)
        .first()

      crate = await crate.toJSON()

      if (server_id) {
        crate.items = _.filter(crate.items, (item) => {
          return _.some(item.itemable.servers, { id: server_id })
        })
      }
      // crate.items = dataItems
      crateTest[id] = crate
    } else {
      crate = crateTest[id]
    }
    let sum = crate.items.reduce((a, b) => a + b.change, 0)
    let itemList = []
    // TODO: Redis cache 100 - items in cache
    if (spinTest == null) {
      for (let i = 0; i < 110; i++) {
        let num = getRandomIntInclusive(1, sum)
        let prevCheck = 0
        let itemToPull = false
        crate.items.forEach(item => {
          if (num >= prevCheck && num <= prevCheck + item.change) {
            itemToPull = item
          }
          prevCheck += item.change
        })
        itemList.push(itemToPull)
      }
      spinTest = itemList
    } else {
      itemList = spinTest
    }

    let rand = getRandomIntInclusive(0, 100)
    let itemListCopy = JSON.parse(JSON.stringify(itemList))
    let selected = itemListCopy.splice(rand, 1)[0]

    console.log(itemList.length)
    console.log(rand)

    const historyRecord = await this.request.user
      .crate_histories()
      .create({
        crate_id: crate.id,
        crate_items_id: selected.id
      })

    data.cases--
    data.keys--
    data.save()

    let items_to = [];

    itemList.forEach(item => {
      items_to.push(json_output(item))
    })



    this.socket.emit('crateSpin', {
      data: data,
      items: items_to,
      select: {
        ...json_output(selected),
        time: historyRecord.created_at
      },
      mctime: (new Date() - microtime)/1000 + ' sec'
    })

    // Обработка TTS
    if (TTSItem.morphType == selected.itemable_type) {
      Redis.publish('tts/run', JSON.stringify({
        item_id: selected.itemable_id,
        user_id: this.request.user.id,
        server_id: server_id,
      }))
    }
    // Обработка Pointshop
    if (PointshopItem.morphType == selected.itemable_type) {
      let inv = await UserPointshop
        .findOrCreate({
          user_id: this.request.user.id,
          server_id: server_id
        })
      let item = await inv
        .items()
        .create({
          data: [],
          pointshop_item_id: selected.itemable_id,
        })

      let socket = await Redis.get(`ws:server:${server_id}`)
      const topic = Ws
        .getChannel('server/pointshop')
        .topic('server/pointshop')

      if (topic){
        topic.emitTo('addItem', {
          user_id: this.request.user.id,
          item: item
        }, [
          `server/pointshop#${socket}`
        ])
      }
    }
  }
}

module.exports = RouletteController
