'use strict'

const Crate = use('App/Models/Economy/Crate')
const User = use('App/Models/User')
const UserCrate = use('App/Models/User/Crate')
const UserPointshop = use('App/Models/User/Pointshop')
const UserService = use('App/Services/UserService')
const UserInventory = use('App/Models/User/Inventory')
const CrateHistory = use('App/Models/User/Crate/CrateHistory')
const Redis = use('Redis')
const Ws = use('Ws')
const Env = use('Env')
const Event = use('Event')

const Bull = use('Rocketseat/Bull')
const RouletteDropJob = use('App/Jobs/RouletteDrop')

const crypto = require('crypto')
const moment = require('moment')
const _ = require('lodash')
const RouletteDrop = require('../../../Jobs/RouletteDrop')

const TTSItem = use('App/Models/Economy/TTS/TTSItem')
const CraftItem = use('App/Models/Economy/Craft/CraftItem')
const PointshopItem = use('App/Models/Economy/Pointshop/PointshopItem')

const UserCraftItem = use('App/Models/User/Craft/CraftItem')
const UserPointshopItem = use('App/Models/User/Pointshop/PointshopItem')

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

let spinTest = {}
let spinTestCount = {}

let crateTest = {}
let crateTestCount = {}
class RouletteController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request

    this.onCrateList()
  }

  async onCrateList () {
    let server = this.request.server

    this.socket.emit('crateList', await server
      .crates()
      .setHidden(['created_at', 'updated_at', 'hoci', 'pivot'])
      .fetch()
    )
  }
  async onCrateOpen ({ id, limit, user_id }) {
    let mctime = new Date()
    let user = await User.find(user_id)
    let server = this.request.server
    // console.log(user)
    let history = await user
      .crate_histories()
      .with('item', (builder) => {
        builder.with('itemable', (builder) => {
          builder.whereHas('servers', (builder) => {
            builder.where('server_id', server.id)
          }, '>', 0)
        })
      })
      .limit(limit || 10)
      .orderBy('id', 'desc')
      .fetch()

    history = await history.toJSON()
    history = _.map(history, (item) => ({
      ...json_output(item.item),
      created_at: item.created_at
    }))

    let crate = await Crate
      .query()
      .setHidden([ 'created_at', 'updated_at' ])
      .with('items.itemable.servers')
      .where('id', id)
      .first()

    crate = await crate.toJSON()

    crate.items = _.filter(crate.items, (item) => {
      return _.some(item.itemable.servers, { id: server.id })
    })
    crate.items = _.map(crate.items, (item) => ({
      ...json_output(item),
      change: item.change
    }))

    let data = await UserCrate
      .findOrCreate(
        { user_id: user_id, crate_id: id, server_id: server.id },
        { user_id: user_id, crate_id: id, server_id: server.id }
      )

    this.socket.emit('crateOpen', {
      user_id: user_id,
      crate: crate,
      data: data,
      history: history,
      mctime: (new Date() - mctime)/1000 + ' sec'
    })
  }
  async onBuy ({ id, user_id, type, count }) {
    let server = this.request.server

    let mctime = new Date()

    count = count || 1

    let buy_type = ''

    if (type == 'keys') {
      buy_type = 'buy_key'
    }
    if (type == 'cases') {
      buy_type = 'buy_case'
    }

    let crate = await Crate.find(id)

    let user_pointshop = await UserPointshop
      .findOrCreate({
        user_id: user_id,
        server_id: server.id
      })

    if (user_pointshop.points < (count * crate[buy_type]) ) {
        // TODO: Return notify user
      console.log('Nedostatochno points')
      return
    }

    user_pointshop.points += -(crate[buy_type] * count)
    await user_pointshop.save()

    UserService.UpdatePoints(user_id, server.id)

    let data = await UserCrate
      .findOrCreate(
        { user_id: user_id, crate_id: id, server_id: server.id },
        { user_id: user_id, crate_id: id, server_id: server.id }
      )

    data[type] = data[type] + count
    data.save()

    this.socket.emit('updateData', {
      crate_id: id,
      user_id: user_id,
      data: data,
      mctime: (new Date() - mctime)/1000 + ' sec'
    })
  }
  async onSell ({ id, user_id, type }) {
    let server = this.request.server

    let mctime = new Date()

    // count = count || 1

    let sell_type = ''

    if (type == 'keys') {
      sell_type = 'sell_key'
    }
    if (type == 'cases') {
      sell_type = 'sell_case'
    }


    let data = await UserCrate
      .findOrCreate(
        { user_id: user_id, crate_id: id, server_id: server.id },
        { user_id: user_id, crate_id: id, server_id: server.id }
      )

    if (data[type] <= 0) {
      return
    }

    data[type]--
    data.save()

    let crate = await Crate.find(id)

    let user_pointshop = await UserPointshop
      .findOrCreate({
        user_id: user_id,
        server_id: server.id
      })

    user_pointshop.points += crate[sell_type]
    await user_pointshop.save()

    UserService.UpdatePoints(user_id, server.id)

    this.socket.emit('updateData', {
      crate_id: id,
      user_id: user_id,
      data: data,
      mctime: (new Date() - mctime)/1000 + ' sec'
    })
  }

  async DropLetItem ({ user_id, server_id, selected }) {
    // Обработка крафт предметов
    if (CraftItem.morphType == selected.itemable_type) {
      let invItem = new UserCraftItem
      invItem.craft_item_id = selected.itemable_id
      invItem.user_id = user_id
      await invItem.save()
    }
    // Обработка TTS
    if (TTSItem.morphType == selected.itemable_type) {
      Redis.publish('tts/run', JSON.stringify({
        item_id: selected.itemable_id,
        user_id: user_id,
        server_id: server_id
      }))
    }
    // Обработка Pointshop
    if (PointshopItem.morphType == selected.itemable_type) {
      let inv = await UserPointshop
        .findOrCreate({
          user_id: user_id,
          server_id: server_id
        })

      let count = await inv
        .items()
        .getCount()

      let item = await inv
        .items()
        .create({
          data: [],
          pointshop_item_id: selected.itemable_id,
        })

      if (count + 1 > Env.get('USER_INVENTORY_LIMIT')) {
        item.deleted_at = moment(new Date())
          .format('YYYY-MM-DD HH:mm:ss')

        await item.save()

        let invItem = new UserInventory
        invItem.itemable_type = UserPointshopItem.morphType
        invItem.itemable_id = item.id
        invItem.user_id = user_id
        await invItem.save()

        UserService.updateInventoryCount(user_id, server_id)

        // Это нужно, чтобы счет не уходил в -1
        count--

        let socket = await Redis.get(`ws:server:${server_id}`)
        const topic = Ws
          .getChannel('server/pointshop')
          .topic('server/pointshop')

        if (topic){
          topic.emitTo('addItem', {
            user_id: user_id,
            item: item,
            count: count + 1
          }, [
            `server/pointshop#${socket}`
          ])
        }
      }
    }
  }

  async onCrateSpin ({ id, user_id, force, UserCrateData }) {
    let server = this.request.server
    let mctime = new Date()
    let data
    if (UserCrateData) {
      data = UserCrateData
    } else {
      data = await UserCrate
      .findOrCreate(
        { user_id: user_id, crate_id: id, server_id: server.id },
        { user_id: user_id, crate_id: id, server_id: server.id }
      )
    }

    if (data.cases <= 0 || data.keys <= 0) {
      return
    }

    let crate = await Crate.find(id)
    if (crate.is_premium) {
      const user = await User.find(user_id)
      const is_premium = await user.is_premium()
      if (!is_premium) {
        UserService.notifyOnServer(
          user_id,
          this.request.server.id,
          {
            message: `Для того, чтобы открыть данный кейс необходим PREMIUM`,
            length: 3,
            type: 1
          }
        )

        return
      }

      let count = await Redis.get(`premium_crate:${id}:user:${user_id}`)
      if (!count) { count = 0 }
      count = Number(count)
      count = count + 1
      if (count > 5) {
        UserService.notifyOnServer(
          user_id,
          this.request.server.id,
          {
            message: `PREMIUM кейс можно открыть только 5 раз в сутки`,
            length: 3,
            type: 1
          }
        )

        return
      }
      await Redis.set(`premium_crate:${id}:user:${user_id}`, count)
    }

    // TODO: Redis cache
    if (crateTest[id] == null) {

      crate = await Crate
        .query()
        .with('items.itemable.servers')
        .where('id', id)
        .first()

      crate = await crate.toJSON()
      // console.log(crate)
      crate.items = _.filter(crate.items, (item) => {
        return _.some(item.itemable.servers, { id: server.id })
      })

      // crate.items = dataItems
      crateTest[id] = crate
      crateTestCount[id] = 0
    } else {
      crate = crateTest[id]
      if (!force) {
        crateTestCount[id]++
      }
      if (crateTestCount[id] > 2) {
        console.log('deleted')
        delete crateTest[id]
        delete crateTestCount[id]
      }
    }

    let sum = crate.items.reduce((a, b) => a + b.change, 0)
    let itemList = []
    // TODO: Redis cache 100 - items in cache

    if (spinTest[id] == null) {
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
      spinTest[id] = itemList
      spinTestCount[id] = 0
    } else {
      itemList = spinTest[id]

      if (!force) {
        spinTestCount[id]++
      }
      if (spinTestCount[id] > 2) {
        console.log('deleted spin')
        delete spinTest[id]
        delete spinTestCount[id]
      }
    }

    // console.log(crate.items)

    let rand = getRandomIntInclusive(0, 100)
    let itemListCopy = JSON.parse(JSON.stringify(itemList))
    itemListCopy = _.shuffle(itemListCopy);
    let selected = itemListCopy.splice(rand, 1)[0]
    let historyRecord
    if (!force) {
      let user = await User.find(user_id)
      historyRecord = await user
        .crate_histories()
        .create({
          crate_id: crate.id,
          crate_items_id: selected.id
        })
    } else {
      let historyRecordSolo = new CrateHistory()
      historyRecordSolo.user_id = user_id
      historyRecordSolo.crate_id = crate.id
      historyRecordSolo.crate_items_id = selected.id
      historyRecordSolo.save()
    }
    data.cases--
    data.keys--
    data.save()

    if (!force) {
      //crypto.randomBytes(3).toString('hex')
      let format_items = {}
      let items_to = _.map(itemList, (item) => {
        if (!format_items[item.id]) {
          format_items[item.id] = {
            hex: 'F' + crypto.randomBytes(2).toString('hex'),
            item: item
          }
        }

        return format_items[item.id].hex
      })

      let items_names = _.mapValues(_.mapKeys(format_items, 'hex'), (o) => { return o.item.itemable.name })
      // itemList.forEach(item => {
      //   items_to.push(json_output(item))
      // })

      this.socket.emit('crateSpin', {
        user_id: user_id,
        data: data, // Инфа кейсов
        items: items_to, // Список дропа,
        items_names: items_names, // Названия
        select: {
          ...json_output(selected),
          time: historyRecord.created_at
        },
        mctime: (new Date() - mctime)/1000 + ' sec'
      })

      // Event.emit('roulette::drop', {
      //   user_id: user_id,
      //   server_id: server.id,
      //   selected: selected,
      //   force: force
      // })
      Bull.add(RouletteDropJob.key, {
        user_id: user_id,
        server_id: server.id,
        selected: selected,
        force: force
      })
      // await this.DropLetItem ({
      //   user_id: user_id,
      //   server_id: server.id,
      //   selected: selected
      // })
    } else {
      // Event.emit('roulette::drop', {
      //   user_id: user_id,
      //   server_id: server.id,
      //   selected: selected,
      //   force: force
      // })

      Bull.add(RouletteDropJob.key, {
        user_id: user_id,
        server_id: server.id,
        selected: selected,
        force: force
      })
      if (force == 'all') {
        return {
          ...json_output(selected),
          data: data,
          time: moment(new Date())
            .format('YYYY-MM-DD HH:mm:ss')
        }
      }
    }
  }
  async onCrateSpinAll ({ id, user_id, max }) {
    let tospin = max

    let server = this.request.server
    let mctime = new Date()

    let data = await UserCrate
      .findOrCreate(
        { user_id: user_id, crate_id: id, server_id: server.id },
        { user_id: user_id, crate_id: id, server_id: server.id }
      )

    let crate = await Crate.find(id)
    if (crate.is_premium) {
      UserService.notifyOnServer(
        user_id,
        this.request.server.id,
        {
          message: `Кейс для PREMIUM невозможно открыть быстрым способом`,
          length: 3,
          type: 1
        }
      )

      return
    }

    let maxis = data.cases >= data.keys && data.keys || data.cases
    if (maxis > 500) {
      maxis = 500
    }

    // TODO: Переделать под права людей
    if (maxis > 50) {
      maxis = 50
    }
    if (data.cases <= 0 || data.keys <= 0) {
      return
    }

    if (maxis === tospin) {
      let raid = []
      if (crateTestCount[id] == null) {
        crateTestCount[id] = 1
      }
      crateTestCount[id]++

      if (spinTest[id] == null) {
        spinTestCount[id] = 1
      }
      spinTestCount[id]++


      for (let index = 0; index < tospin; index++) {
        // console.log(index)
        let result = await this.onCrateSpin ({
          id: id,
          user_id: user_id,
          force: 'all',
          UserCrateData: data
        })

        data = result.data

        delete result.data

        raid.push(result)

        // console.log(result)
      }

      // data.cases = data.cases - tospin
      // data.keys = data.keys - tospin

      this.socket.emit('crateSpinAll', {
        user_id: user_id,
        data: data,
        dropped: raid,
        mctime: (new Date() - mctime)/1000 + ' sec'
      })
    }
    // if (data.cases <= 0 || data.keys <= 0) {
    //   return
    // }
  }
}

module.exports = RouletteController
