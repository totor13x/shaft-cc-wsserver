'use strict'

const UserInventory = use('App/Models/User/Inventory')
const UserPointshop = use('App/Models/User/Pointshop')
const UserService = use('App/Services/UserService')
const Redis = use('Redis')
const Ws = use('Ws')
const Env = use('Env')

const moment = require('moment')
const _ = require('lodash')

const TTSItem = use('App/Models/Economy/TTS/TTSItem')
const PointshopItem = use('App/Models/Economy/Pointshop/PointshopItem')

const UserPointshopItem = use('App/Models/User/Pointshop/PointshopItem')

const RouletteEvent = exports = module.exports = {}
RouletteEvent.onDrop = async ({ selected, user_id, server_id, force }) => {
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

        return
      }

      let socket = await Redis.get(`ws:server:${server_id}`)
      const topic = Ws
        .getChannel('server/pointshop')
        .topic('server/pointshop')

      if (topic) {
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
