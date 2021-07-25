'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Server extends Model {

  static get hidden () {
    return [
      'api_token',
    ]
  }

  items () {
    return this.belongsToMany('App/Models/Economy/Pointshop/PointshopItem')
      .pivotTable('server_items')
  }
  crates () {
    return this.belongsToMany('App/Models/Economy/Crate')
      .pivotTable('server_crates')
  }
}

module.exports = Server
