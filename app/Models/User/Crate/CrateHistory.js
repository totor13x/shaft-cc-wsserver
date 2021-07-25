'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CrateHistory extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:Morphable')
  }

  static get table () {
    return 'user_crates_history'
  }
  crate () {
    return this.belongsTo('App/Models/Economy/Crate')
  }
  user () {
    return this.belongsTo('App/Models/User')
  }
  item () {
    return this.belongsTo('App/Models/Economy/Crate/CrateItem', 'crate_items_id', 'id')
  }
}
module.exports = CrateHistory
