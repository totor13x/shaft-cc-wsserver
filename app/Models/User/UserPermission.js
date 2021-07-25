'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class UserPermission extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:Morphable')
    this.addTrait('HasRolesAndPermission')
    this.morphKey = 'App\\Models\\User\\UserPermission'
  }
  static get table () {
    return 'users_permissions'
  }

  static get createdAtColumn () {
    return null
  }
  static get updatedAtColumn () {
    return null
  }

  user () {
    return this.belongsTo('App/Models/User')
  }
  permission () {
    return this.belongsTo('App/Models/Core/Permission')
  }
}

module.exports = UserPermission
