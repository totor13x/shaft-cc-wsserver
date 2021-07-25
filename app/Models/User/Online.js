'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Online extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:CastAttributes')
  }

  static get table () {
    return 'user_online'
  }

  static get casts () {
    return {
      data: 'array',
      start: 'datetime',
      end: 'datetime'
    }
  }
  user () {
    return this.belongsTo('App/Models/User')
  }
  server () {
    return this.belongsTo('App/Models/Server')
  }
}

module.exports = Online
