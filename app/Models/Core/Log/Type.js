'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Type extends Model {
  static get table () {
    return 'log_types'
  }
}

module.exports = Type
