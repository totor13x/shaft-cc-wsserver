'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PointshopItem extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:CastAttributes')
    this.morphType = 'App\\Models\\User\\Pointshop\\PointshopItem'
  }

  static get table () {
    return 'user_pointshop_items'
  }

  static get hidden () {
    return [
      'pointshop_item_id',
      'pointshop_id',
      'created_at',
      'updated_at',
      'deleted_at'
    ]
  }
  static get computed () {
    return ['item_id']
  }
  static get casts () {
    return {
      data: 'array',
      deleted_at: 'datetime',
    }
  }

  getItemId ({ pointshop_item_id }) {
    return pointshop_item_id
  }

  pointshop () {
    return this.belongsTo('App/Models/User/Pointshop')
  }
  pointshop_item () {
    return this.belongsTo('App/Models/Economy/Pointshop/PointshopItem', 'pointshop_item_id', 'id')
  }
}

module.exports = PointshopItem
