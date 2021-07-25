'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const Redis = use('Redis')

class TTS extends Model {
  static get table () {
    return 'user_tts_balance'
  }
  user () {
    return this.belongsTo('App/Models/User')
  }
}

module.exports = TTS
