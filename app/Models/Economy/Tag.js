'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Tag extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:CastAttributes')
    this.addTrait('HasTagFunctions')
  }


  static get casts () {
    return {
      id: 'string',
      primary_color_1: 'array',
      primary_color_2: 'array',
      secondary_color_1: 'array',
      secondary_color_2: 'array',
      border_color_1: 'array',
      border_color_2: 'array',
    }
  }

  
  users () {
    return this.belongsToMany('App/Models/User')
      .pivotTable('users_tags')
  }
  // items () {
  //   return this.hasMany('App/Models/Economy/Crate/Item')
  // }
  // servers () {
  //   return this.belongsToMany('App/Models/Server')
  //     .pivotTable('server_crates')
  // }
}

module.exports = Tag
