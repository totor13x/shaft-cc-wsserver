'use strict'

const UserPointshop = use('App/Models/User/Pointshop')
// const AttributeCaster = use('AttributeCaster')
// const castsItems = {
//   items: [{
//     data: 'object'
//   }]
// }
const Redis = use('Redis')
const PointshopItem = use('App/Models/Economy/Pointshop/PointshopItem')
const Server = use('App/Models/Server')
const User = use('App/Models/User')
const UserService = use('App/Services/UserService')
const Env = use('Env')
const plural = require('plural-ru')
const _ = require('lodash')

const Bull = use('Rocketseat/Bull')
const RouletteDropJob = use('App/Jobs/RouletteDrop')

class PointshopController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request

    this.LoadCommissions()
  }

  async LoadCommissions() {
    let commissions = await Redis.get('cache:pointshop.commissions')
    commissions = JSON.parse(commissions)

    this.commissions = commissions
  }

  async findUserPointshop (user_id, server_id) {
    let inv = await UserPointshop
      .findOrCreate({
        user_id: user_id,
        server_id: server_id
      })

    await inv.load('items')

    return inv
  }
  async onGetItems (user_id) {
    console.log(user_id)
    if (this.request.server) {
      let user_pointshop = await this.findUserPointshop(user_id, this.request.server.id)
      let json = await user_pointshop.toJSON()

      let count = await user_pointshop
        .items()
        .getCount()

      this.socket.emit('getItems', {
        user_id: user_id,
        items: json,
        count: count,
        max: Env.get('USER_POINTSHOP_LIMIT')
      })

      await user_pointshop.load('itemsWithInventory')

      const ps_items = await PointshopItem
        .query()
        .where('user_id', user_id)
        .whereHas('servers', (builder) => {
          builder.where('server_id', this.request.server.id)
        })
        .fetch()

      // console.log(await ps_items.toJSON())
      // const private_items_id = _.map(ps_items.rows, 'id')

      const all_items = user_pointshop.getRelated('itemsWithInventory')
      const all_items_id = _.uniq(_.map(all_items.rows, 'pointshop_item_id'))

      // console.log(all_items_id)
      _.each(ps_items.rows, async (item) => {
        if (!_.includes(all_items_id, item.id)) {
          let give_item = await user_pointshop
            .items()
            .create({
              data: [],
              pointshop_item_id: item.id
            })

          give_item = await give_item.toJSON()

          await this.socket.emit('addItem', {
            user_id: user_id,
            item: give_item,
            count: count + 1,
          })
          // console.log(item)
          // Bull.add(RouletteDropJob.key, {
          //   user_id: user_id,
          //   server_id: this.request.server.id,
          //   selected: selected,
          //   force: force
          // })
        }
      })
      // _.each(all_items.rows, (item) => {
      //   if (_item.item_id)
      // })
      // console.log(await all_items.toJSON())
    }
  }
  async onCheck (message) {
    // Ассоциация, с серверами
    // const item = await PointshopItem.find(1)
    // const srv = await Server.find(2)
    // await item.servers().attach([srv.id])
    // await item.load('servers')

    // const srv = await Server.find(2)
    // await srv.load('items')
    // console.log(srv.toJSON())
    // item.toJSON()

    // let user_pointshop = await this.findUserPointshop(1, 'gm_murder')
    // let object = await user_pointshop.toJSON()
    // console.log(object)
    // console.log(message)
    // this.socket.emit('data', object)
  }

  // TODO: Перенести код куда нибудь в нормальное место
  async onPoints(data) {
    // console.log(data)
    let user_pointshop = await this.findUserPointshop(data.user_id, this.request.server.id)
    // console.log(await user_pointshop)
    user_pointshop.points += data.points
    await user_pointshop.save()

    this.socket.emit('points', {
      user_id: data.user_id,
      points: user_pointshop.points
    })
  }
  async onAddItem(data) {
    let user_pointshop = await this.findUserPointshop(data.user_id, this.request.server.id)
    let user = await User.find(data.user_id)
    
    let psitem = await PointshopItem.find(data.item_id)

    if (psitem.user_id) {
      if (psitem.user_id != data.user_id) {
        UserService.notifyOnServer(
          data.user_id,
          this.request.server.id,
          {
            message: `PRV | Запрещено к покупке`,
            length: 3,
            type: 1
          }
        )
        return
      }
    }

    if (psitem.is_hidden) {
      UserService.notifyOnServer(
        data.user_id,
        this.request.server.id,
        {
          message: `Запрещено к покупке`,
          length: 3,
          type: 1
        }
      )
      return
    }

    const is_premium = await user.is_premium()

    if (psitem.is_premium) {
      if (!is_premium) {
        UserService.notifyOnServer(
          data.user_id,
          this.request.server.id,
          {
            message: `Предмет доступен только с премиумом`,
            length: 3,
            type: 1
          }
        )
        return
      }
    }

    if (user_pointshop.points < psitem.price) {
      UserService.notifyOnServer(
        data.user_id,
        this.request.server.id,
        {
          message: `Недостаточно поинтов для покупки`,
          length: 3,
          type: 1
        }
      )
      return
    }

    let count = await user_pointshop
      .items()
      .getCount()

    if (count + 1 > Env.get('USER_POINTSHOP_LIMIT')) {
      UserService.notifyOnServer(
        data.user_id,
        this.request.server.id,
        {
          message: `В инвентаре нет свободных слотов`,
          length: 3,
          type: 1
        }
      )
      return
    }

    let item = await user_pointshop
      .items()
      .create({
        data: [],
        pointshop_item_id: data.item_id
      })

    item = await item.toJSON()

    if (data.price != 0) {
      await this.onPoints({
        user_id: data.user_id,
        points: -psitem.price,
      })
    }


    await this.socket.emit('addItem', {
      user_id: data.user_id,
      item: item,
      count: count + 1,
    })

    UserService.notifyOnServer(data.user_id, this.request.server.id, {
      message: `Ты купил ${psitem.name} за ${plural(psitem.price, '%d поинт', '%d поинта', '%d поинтов')}`,
      length: 3
    })
    // console.log(item)
  }
  async onDelItem(data) {
    let user_pointshop = await this.findUserPointshop(data.user_id, this.request.server.id)

    let item = await user_pointshop
      .items()
      .with('pointshop_item')
      .where('id', data.perm_id)
      .first()

    let psitem = await item.getRelated('pointshop_item')

    item = await item.delete()
    console.log(item)
    if (item) {
      if (!data.once) {
        let finalPrice = psitem.price
        let commission = 1 - this.commissions.default

        if (commission <= 0) {
          finalPrice = psitem.price
        } else {
          finalPrice = psitem.price * (1 - commission)
        }

        await this.onPoints({
          user_id: data.user_id,
          points: finalPrice,
        })
        UserService.notifyOnServer(data.user_id, this.request.server.id, {
          message: `Ты продал ${psitem.name} за ${plural(finalPrice, '%d поинт', '%d поинта', '%d поинтов')}`,
          // message: `Ты продал ${psitem.name} за ${finalPrice} поинтов`,
          length: 3
        })
      } else {
        UserService.notifyOnServer(data.user_id, this.request.server.id, {
          message: `Одноразовый предмет ${psitem.name} использован`,
          length: 3
        })
      }

      let count = await user_pointshop
        .items()
        .getCount()


      // console.log(count, '----')

      this.socket.emit('delItem', {
        user_id: data.user_id,
        perm_id: data.perm_id,
        count: count,
      })
    }
  }
  async onChangeItem(data) {
    let user_pointshop = await this.findUserPointshop(data.user_id, this.request.server.id)
    let item = await user_pointshop
      .items()
      .with('pointshop_item')
      .where('id', data.item_id)
      .first()

    let item_temp = await item.toJSON()
    let data_temp = item_temp.data

    if (data_temp.length == 0)
      data_temp = {}

    Object.keys(data.item_data).forEach((key) => {
      var val = data.item_data[key];
      data_temp[key] = val

      if (val === false) {
        delete data_temp[key]
      }
    })

    item.data = data_temp
    item.save()

  }
  async onGetInfoBodyGroups(user_id) {
    const server_id = this.request.server.id

    let user = await User.find(user_id)
    user = await user.toJSON()

    user.server_data = user.server_data || {}
    user.server_data[server_id] = user.server_data[server_id] || {}

    const bodygroups =
      user.server_data[server_id].bodygroups

    this.socket.emit('getInfoBodyGroup', {
      user_id: user_id,
      bodygroups: bodygroups,
    })
  }
  async onSaveBodyGroups(data) {
    const server_id = this.request.server.id
    const user_id = data.user_id

    const user = await User.find(user_id)

    let user_temp = await user.toJSON()
    let data_temp = user_temp.server_data

    data_temp = data_temp || {}

    data_temp[server_id] = data_temp[server_id] || {}

    data_temp[server_id].bodygroups = data.bodygroups

    user.server_data = data_temp
    await user.save()

    // console.log(JSON.stringify(await user.toJSON()))
  }
}

module.exports = PointshopController
