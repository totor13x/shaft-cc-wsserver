'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class UserRole extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:Morphable')
    this.addTrait('HasRolesAndPermission')
    this.morphKey = 'App\\Models\\User\\UserRole'
  }
  static get table () {
    return 'users_roles'
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
  role () {
    return this.belongsTo('App/Models/Core/Role')
  }
}

module.exports = UserRole
