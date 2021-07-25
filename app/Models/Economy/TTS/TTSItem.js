'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class TTSItem extends Model{
  static boot () {
    super.boot()
    this.addTrait('@provider:CastAttributes')
    this.addTrait('@provider:Morphable')
    this.morphType = 'App\\Models\\Economy\\TTS\\TTSItem'
    // this.morphKey = 'App/Models/Economy/TTS/Item'
  }

  static get table () {
    return 'tts_items'
  }
  static get casts () {
    return {
      data: 'array',
      triggers: 'array',
    }
  }
  servers () {
    return this.belongsToMany('App/Models/Server', 'item_id', 'server_id')
      .pivotTable('tts_items_servers')
  }
  // crate_items () {
  //   return this.morphMany('App/Models/Economy/Crate/Item', 'id', 'itemable_id', 'itemable_type')
  // }
}

module.exports = TTSItem
