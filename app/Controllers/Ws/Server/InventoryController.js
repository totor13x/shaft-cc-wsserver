'use strict'

// При добавлении нового типа для хранения
// Нужно будет изменить сериализер

// Это нужно, чтобы не было багов с контактом
// Сам сериализер находится на пути
// App/Serializers/InventorySerializer

const UserPointshop = use('App/Models/User/Pointshop')
const moment = require('moment')
const SteamID = require('steamid')
const User = use('App/Models/User')
const Env = use('Env')
const Ws = use('Ws')
const UserPointshopItem = use('App/Models/User/Pointshop/PointshopItem')

const UserService = use('App/Services/UserService')

class InventoryController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }
  async onOpenInventory ({ user_id, page, type }) {
    let user = await User.find(user_id)
	let self = this
    console.log(type)
    let inventory = user
      .inventory()
	  .where(function () {
		this
		  .where('server_id', self.request.server.id)
		  .orWhereNull('server_id')
	  })
      .with('itemable', function(builder) {
        // console.log(type)
        // if (type == 'all') {
          builder.with('pointshop_item')
          // i drugie
        // }
        // if (type == 'ps') {
        //   builder.with('pointshop_item')
        //   builder.where('itemable_type', UserPointshopItem.morphType)
        // }
      })
      if (type == 'ps') {
        inventory
          .where(
            'itemable_type',
            UserPointshopItem.morphType
          )
      }
	 
    inventory = await inventory
      .orderBy('id', 'desc')
      .paginate(page, 30)

    let json = await inventory.toJSON()
    // console.log(json)
    this.socket.emit('openInventory', {
      user_id: user_id,
      type: type,
      json
    })
  }
async onCountInventory ({ user_id }) {
    let user = await User.find(user_id)

    let inventoryCount = await user
      .inventory()
      .getCount()

    this.socket.emit('countInventory', {
      user_id: user_id,
      max: Env.get('USER_INVENTORY_LIMIT'),
      count: inventoryCount,
    })
  }
  async onToInventory (data) {
    let user = await User.find(data.user_id)
    let item

    if (user) {
      let inventoryCount = await user
        .inventory()
        .getCount()

      if (inventoryCount + 1 > Env.get('USER_INVENTORY_LIMIT')) {
        UserService.notifyOnServer(
          user.id,
          this.request.server.id,
          {
            message: `В хранилище нет свободных слотов`,
            length: 3,
            type: 1
          }
        )
        return
      }

      if (data.type == 'ps') {
        item = await UserPointshopItem.find(data.perm_id)
        // console.log(UserPointshopItem.morphType)
        // let ps_item = item.pointshop_item()
        // console.log(ps_item.RelatedModel.morphType)
        // console.log(item.deleted_at)
        if (item.deleted_at == null) {
          await user.inventory()
            .create({
              itemable_type: UserPointshopItem.morphType,
              itemable_id: item.id,
			        server_id: this.request.server.id
            })
          item.data = {}
          item.deleted_at = moment(new Date())
            .format('YYYY-MM-DD HH:mm:ss')

          await item.save()
          await item.load('pointshop_item')

          let ps_item = item.getRelated('pointshop_item')


          let inv = await UserPointshop
            .findOrCreate({
              user_id: data.user_id,
              server_id: this.request.server.id
            })

          let count = await inv
            .items()
            .getCount()

          const topic = Ws
            .getChannel('server/pointshop')
            .topic('server/pointshop')

          if (topic){
            topic.broadcast('delItem', {
              user_id: data.user_id,
              perm_id: data.perm_id,
              count: count
            })
          }

          this.onCountInventory({
            user_id: data.user_id
          })

          UserService.notifyOnServer(
            user.id,
            this.request.server.id,
            {
              message: `${ps_item.name} перенесен в хранилище`,
              length: 3
            }
          )
        }
      }
    }
  }
  async onFromInventory (data) {
    let user = await User.find(data.user_id)

    // if (data.type == 'ps') {
    let item = await user.inventory()
        .with('itemable')
        .where('id', data.inv_item_id)
        .first()
    if (item) {
      let itemable = item.getRelated('itemable')

      if (itemable.deleted_at != null) {
        // Pointshop
        if (item.itemable_type == UserPointshopItem.morphType) {
          let inv = await UserPointshop
            .findOrCreate({
              user_id: data.user_id,
              server_id: this.request.server.id
            })

          let count = await inv
            .items()
            .getCount()

          if (count + 1 > Env.get('USER_POINTSHOP_LIMIT')) {
            UserService.notifyOnServer(
              user.id,
              this.request.server.id,
              {
                message: `В инвентаре нет свободных слотов`,
                length: 3,
                type: 1
              }
            )
            return
          }


          await itemable.load('pointshop_item')
          let ps_item = itemable.getRelated('pointshop_item')

          itemable.deleted_at = null
          await itemable.save()

          await item.delete()

          const topic = Ws
            .getChannel('server/pointshop')
            .topic('server/pointshop')

          if (topic){
            topic.broadcast('addItem', {
              user_id: data.user_id,
              item: itemable,

              count: count + 1
            })
          }

          this.onCountInventory({
            user_id: data.user_id
          })

          UserService.notifyOnServer(
            user.id,
            this.request.server.id,
            {
              message: `${ps_item.name} перенесен в серверный инвентарь`,
              length: 3
            }
          )
        }
      }
    }
  }
}

module.exports = InventoryController
