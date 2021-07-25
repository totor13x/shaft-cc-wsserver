'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const Redis = use('Redis')
const moment = require('moment')

class User extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:CastAttributes')
    this.addTrait('HasRolesAndPermission')
  }
  static get hidden () {
    return [
      'password',
      'remember_token',
      'api_token',
      'last_parse_websteamapi_at',
      'server_data'
    ]
  }
  static get casts () {
    return {
      server_data: 'array',
      premium_at: 'datetime',
    }
  }


  discord () {
    return this.belongsTo('App/Models/User/Discord')
  }

  locks () {
    return this.hasMany('App/Models/Lock/Active')
  }

  crate_histories () {
    return this.hasMany('App/Models/User/Crate/CrateHistory')
  }

  inventory () {
    return this.hasMany('App/Models/User/Inventory')
  }

  tts_history () {
    return this.hasMany('App/Models/TTS')
  }

  async is_gc()
  {
    return await this.locks().where('type','gc').first()
  }

  async tts_balance () {
    return await this.tts_history().getSum('cost') || 0
  }

  tags () {
    return this.belongsToMany('App/Models/Economy/Tag')
      .pivotTable('users_tags')
  }

  async is_premium () {
    return await this.premium_at
		? moment().isBefore(this.premium_at)
		: false
  }

  static updatePoints( server_id ) {
  }
}

module.exports = User
