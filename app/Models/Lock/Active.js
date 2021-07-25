'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment')
class Active extends Model {

  static get table () {
    return 'lock_active'
  }
  static get dates () {
    return super.dates.concat(['locked_at'])
  }
  static get computed () {
    return ['locked_at_unix']
  }
  getLockedAtUnix ({ locked_at }) {
    return moment(locked_at).format('X')
  }
}

module.exports = Active
