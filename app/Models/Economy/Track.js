'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const Env = use('Env')

class Track extends Model {
  static boot () {
    super.boot()
  }


  static get computed () {
    return ['cdn_path', 'cdn_waveform']
  }

  getCdnPath ({ path, system }) {
	if (system == 'old') {
		return Env.get('CDN_OLD_URL', '') + 'tracks/' + path
	} else {
		return Env.get('CDN_URL', '') + path
	}
  }
  getCdnWaveform ({ waveform }) {
		return Env.get('CDN_URL', '') + waveform
  }

  user () {
    return this.belongsTo('App/Models/User')
  }
}

module.exports = Track
