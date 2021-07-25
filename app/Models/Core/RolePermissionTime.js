'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class RolePermissionTime extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:Morphable')
    this.addTrait('@provider:CastAttributes')
    this.addTrait('HasRolesAndPermission')
  }
  static get table () {
    return 'role_permission_timeable'
  }
  static get casts () {
    return {
      ended_at: 'datetime',
    }
  }

  morphable () {
    return this.morphTo([
      'App/Models/Core/Permission',
      'App/Models/Core/Role',
    ])
  }
}

module.exports = RolePermissionTime
