'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

const PointshopItem = use('App/Models/Economy/Pointshop/PointshopItem')
const TTSItem = use('App/Models/Economy/TTS/TTSItem')
const CraftItem = use('App/Models/Economy/Craft/CraftItem')

class CrateItem extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:CastAttributes')
    this.addTrait('@provider:Morphable')
  }

  // static get traits () {
  //   return ['@provider:Morphable']
  // }
  static get table () {
    return 'crate_items'
  }
  static get casts () {
    return {
      is_logging: 'boolean',
      color: 'array',
    }
  }

  itemable()
  {
    return this.morphTo([
      TTSItem,
      PointshopItem,
      CraftItem,
    ], 'id', 'id', 'itemable_id', 'itemable_type')
    // return $this->morphTo();
  }
}

module.exports = CrateItem
