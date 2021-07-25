'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Log extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:CastAttributes')
  }

  static get casts () {
    return {
      attrs: 'array',
    }
  }

  type () {
    return this.belongsTo('App/Models/Core/Log/Type')
  }
  server () {
    return this.belongsTo('App/Models/Server')
  }
}

module.exports = Log
