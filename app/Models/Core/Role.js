'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const RolePermissionTime = use('App/Models/Core/RolePermissionTime')
class Role extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:CastAttributes')
    this.addTrait('@provider:Morphable')
    this.addTrait('HasRolesAndPermission')
    this.morphKey = 'App\\Models\\Core\\Role'
  }

  static get casts () {
    return {
      data: 'array',
    }
  }

  // get $morphTypeKeyValue () {
  //   return 'App/Models/Core/Role'
  // }

  permissions () {
    return this.belongsToMany('App/Models/Core/Permission')
      .pivotTable('roles_permissions')
  }

}

module.exports = Role
