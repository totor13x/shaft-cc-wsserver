'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Pointshop extends Model {
  static get table () {
    return 'user_pointshops'
  }
  static get hidden () {
    return [
      'data'
    ]
  }
  user () {
    return this.belongsTo('App/Models/User')
  }
  items () {
    return this.hasMany('App/Models/User/Pointshop/PointshopItem')
      .whereNull('deleted_at')
  }
  itemsWithInventory () {
    return this.hasMany('App/Models/User/Pointshop/PointshopItem')
  }
  server () {
    return this.belongsTo('App/Models/Server')
  }

}

module.exports = Pointshop
