'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class RolePermissionServer extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:Morphable')
    this.addTrait('HasRolesAndPermission')
  }
  static get table () {
    return 'role_permission_servers'
  }

  server () {
    return this.belongsTo('App/Models/Server')
  }

  morphable () {
    return this.morphTo([
      'App/Models/Core/Permission',
      'App/Models/Core/Role',
    ])
  }
}

module.exports = RolePermissionServer
