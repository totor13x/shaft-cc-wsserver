'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class Provider extends ServiceProvider {
  boot() {
    const Event = this.app.use('Adonis/Src/Event')
    Event.emitAsync = (event, ...args) => {
      return Event.emitter.emitAsync(event, ...args)
    }
    // View.global('time', () => new Date().getTime())
  }
}
module.exports = Provider
