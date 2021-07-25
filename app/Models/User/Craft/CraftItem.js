'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CraftItem extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:CastAttributes')
    this.morphType = 'App\\Models\\User\\Craft\\CraftItem'
  }

  static get table () {
    return 'user_craft_items'
  }

  static get casts () {
    return {
      data: 'array',
      items: 'array',
    }
  }

  user () {
    return this.belongsTo('App/Models/User')
  }
  craft_item () {
    return this.belongsTo('App/Models/Economy/Craft/CraftItem')
  }
}

module.exports = CraftItem
