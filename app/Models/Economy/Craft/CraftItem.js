'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CraftItem extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:CastAttributes')
    this.morphType = 'App\\Models\\Economy\\Craft\\CraftItem'
  }

  static get table () {
    return 'craft_items'
  }

  servers () {
    return this.belongsToMany('App/Models/Server', 'craft_item_id', 'server_id')
      .pivotTable('pivot_craft_items_fake')
  }
}

module.exports = CraftItem
