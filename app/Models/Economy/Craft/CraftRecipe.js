'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CraftRecipe extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:Morphable')
    this.addTrait('@provider:CastAttributes')
    this.morphType = 'App\\Models\\Economy\\Craft\\CraftRecipe'
  }

  static get table () {
    return 'craft_recipes'
  }

  static get casts () {
    return {
      data: 'array',
      items: 'array',
      is_reworkable: 'boolean',
      is_open: 'boolean',
    }
  }

  output()
  {
    // return this.morphTo([
    //   TTSItem,
    //   PointshopItem,
    // ], 'id', 'id', 'itemable_id', 'itemable_type')
  }
}

module.exports = CraftRecipe
