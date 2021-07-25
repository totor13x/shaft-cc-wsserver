'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PointshopItem extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:CastAttributes')
    this.addTrait('@provider:Morphable')
    this.morphType = 'App\\Models\\Economy\\Pointshop\\PointshopItem'
    // this.morphKey = 'App/Models/Economy/Pointshop/Item'
  }

  static get table () {
    return 'pointshop_items'
  }
  static get casts () {
    return {
      data: 'array',
      triggers: 'array',
    }
  }
  servers () {
    return this.belongsToMany('App/Models/Server', 'item_id', 'server_id')
      .pivotTable('server_items')
  }
  roles () {
    return this.belongsToMany('App/Models/Core/Role', 'item_id', 'role_id')
      .pivotTable('roles_items')
  }
  crate_items () {
    return this.morphMany('App/Models/Economy/Crate/CrateItem', 'id', 'itemable_id', 'itemable_type')
  }
}

module.exports = PointshopItem
