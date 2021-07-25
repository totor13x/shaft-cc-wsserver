'use strict'
const _ = require('lodash')
// let CoreRole = use('App/Models/Core/Role')
// let Permission = use('App/Models/Core/Permission')

class HasRolesAndPermission {
  register (Model) {
    // const defaultOptions = {}
    // const options = Object.assign(defaultOptions, customOptions)
    if (typeof Model.prototype.roles != 'function') { // Поверь, так было нужно
      Model.prototype.roles = function () {
        return this.hasMany('App/Models/User/UserRole')
      }
    }

    if (typeof Model.prototype.permissions != 'function') { // Иначе эти трейты перезаписывают существующий
      Model.prototype.permissions = function () {
        return this.hasMany('App/Models/User/UserPermission')
      }
    }

    Model.prototype.timeable = function () {
      return this.morphOne('App/Models/Core/RolePermissionTime', 'id', 'morphable_id', 'morphable_type')
    }

    Model.prototype.serverable = function () {
      return this.morphOne('App/Models/Core/RolePermissionServer', 'id', 'morphable_id', 'morphable_type')
    }

    Model.prototype.hasRole = async function ( ...roles ) {
      const rolesGet = await this.roles().with('role').fetch()
      let our = {}
      rolesGet.rows.forEach(({ role }) => {
        if (role) {
          our[role.slug] = true
        }
      })

      return roles.some(role => {
          return our[role]
      })
    }

    Model.prototype.hasPermission = async function ( permission ) {
      let permissions = await this.permissions()
        .with('permission')
        .fetch()

      permissions = await permissions.toJSON()

      return _.includes(_.map(permissions, 'permission.slug'), permission)

    }
    Model.prototype.canImmunity = async function ( immunity ) {
      let fir = await this.roles()
        .with('role')
        .fetch()

      fir = await fir.toJSON()

      const userRole = _.maxBy(fir, 'role.immunity')

      return userRole.role.immunity < immunity
    }

    Model.prototype.hasPermissionThroughRole = async function (permission_slug) {
      let rolesWithPermissions = await this
        .roles()
        .with('role.permissions')
        .fetch()


      return rolesWithPermissions.rows.some(userRole => {
        let role = userRole.getRelated('role')
        let permissions = role.getRelated('permissions')

        return permissions.rows.some(({ slug }) => {
          return slug == permission_slug
        })
      })
    }

    Model.prototype.hasPermissionTo = async function (permission_slug) {
      const hasPermission = await this.hasPermission(permission_slug)
      const hasPermissionThroughRole = await this.hasPermissionThroughRole(permission_slug)
      return (hasPermission || hasPermissionThroughRole)
    }

    // TODO: Не все функции перенесены
    // getAllPermissions
    // givePermissionsTo
    // deletePermissions
    // refreshPermissions
    // Просто пока неясно, надо ли их переносить
  }
}

module.exports = HasRolesAndPermission
