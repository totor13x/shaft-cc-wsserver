// const Mail = use("Mail");

const UserInventory = use('App/Models/User/Inventory')
const UserPointshop = use('App/Models/User/Pointshop')
const UserService = use('App/Services/UserService')
const Redis = use('Redis')
const Ws = use('Ws')
const Env = use('Env')

const moment = require('moment')
const _ = require('lodash')

const TTSItem = use('App/Models/Economy/TTS/TTSItem')
const CraftItem = use('App/Models/Economy/Craft/CraftItem')
const PointshopItem = use('App/Models/Economy/Pointshop/PointshopItem')

const UserCraftItem = use('App/Models/User/Craft/CraftItem')
const UserPointshopItem = use('App/Models/User/Pointshop/PointshopItem')

class RouletteDrop {
  static get key() {
    return "RouletteDrop-key";
  }

  async handle(job) {
    const { data } = job; // the 'data' variable has user data
    const { selected, user_id, server_id, force } = data

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
    // console.log(data)
    // await Mail.send("emails.welcome", data, message => {
    //   message
    //     .to(data.email)
    //     .from("<from-email>")
    //     .subject("Welcome to yardstick");
    // });

    // return data;
  }
}

module.exports = RouletteDrop;
