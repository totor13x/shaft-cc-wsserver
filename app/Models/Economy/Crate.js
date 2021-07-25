'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Crate extends Model {

  static get Serializer () {
    return 'App/Serializers/GenericSerializer'
  }

  items () {
    return this.hasMany('App/Models/Economy/Crate/CrateItem')
  }
  servers () {
    return this.belongsToMany('App/Models/Server')
      .pivotTable('server_crates')
  }
}

module.exports = Crate
