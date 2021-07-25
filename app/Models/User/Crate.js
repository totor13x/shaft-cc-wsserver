'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Crate extends Model {
  static get table () {
    return 'crate_users'
  }
  static get hidden () {
    return [
      'created_at',
      'updated_at',
      'server_id',
      'crate_id',
      'user_id',
      'id',
    ]
  }
  user () {
    return this.belongsTo('App/Models/User')
  }
  crate () {
    return this.belongsTo('App/Models/Economy/Crate')
  }
  server () {
    return this.belongsTo('App/Models/Server')
  }
}

module.exports = Crate
