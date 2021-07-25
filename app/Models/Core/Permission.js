'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Permission extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:Morphable')
    this.addTrait('HasRolesAndPermission')
    this.morphKey = 'App\\Models\\Core\\Permission'
  }

  roles () {
    return this.belongsToMany('App/Models/Core/Role')
      .pivotTable('roles_permissions')
  }
}

module.exports = Permission
