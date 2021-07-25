'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

const UserPointshopItem = use('App/Models/User/Pointshop/PointshopItem')
const TTSItem = use('App/Models/Economy/TTS/TTSItem')

class Inventory extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:CastAttributes')
    this.addTrait('@provider:Morphable')
  }

  static get table () {
    return 'user_inventories'
  }

  static get Serializer () {
    return 'App/Serializers/InventorySerializer'
  }

  static get casts () {
    return {
      data: 'array',
    }
  }

  user () {
    return this.belongsTo('App/Models/User')
  }
  itemable()
  {
    return this.morphTo([
      TTSItem,
      UserPointshopItem,
    ], 'id', 'id', 'itemable_id', 'itemable_type')
  }

  server () {
    return this.belongsTo('App/Models/Server')
  }
}

module.exports = Inventory
