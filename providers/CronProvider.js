'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class CronProvider extends ServiceProvider {
  boot () {
    const Bull = this.app.use('Rocketseat/Bull')
	
    const CronUpdateServerOnline = this.app.use('App/Cron/UpdateServerOnline')
    console.log('provider run')
	Bull.add(CronUpdateServerOnline.key, {}, {
	  repeat: {
		cron: '* * * * *',
	  }
	})
	// Event.emitAsync = (event, ...args) => {
      // return Event.emitter.emitAsync(event, ...args)
    // }
    // View.global('time', () => new Date().getTime())
  }
}
module.exports = CronProvider
