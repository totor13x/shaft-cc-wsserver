'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CraftRecipe extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:Morphable')
    this.addTrait('@provider:CastAttributes')
    this.morphType = 'App\\Models\\User\\Craft\\CraftRecipe'
  }

  static get table () {
    return 'user_craft_recipes'
  }

  static get casts () {
    return {
      data: 'array',
      items: 'array',
    }
  }

  user () {
    return this.belongsTo('App/Models/User')
  }
  craft_recipe () {
    return this.belongsTo('App/Models/Economy/Craft/CraftRecipe')
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
