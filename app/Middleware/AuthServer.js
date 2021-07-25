'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Server = use('App/Models/Server')
const Redis = use('Redis')

class AuthServer {

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async wsHandle ({ socket, request }, next) {
    // call next to advance the request
    const token = request.header('Authorization')
    // console.log()
    // console.log(token, 'srv_token')
    if (token)
    {

		let serv = await Server
			.query()
			.setVisible(['api_token'])
			.fetch()
		serv = await serv.toJSON()
		// console.log(serv)
		// console.log(token)
      let server = await Server
        .query()
        .where('api_token', token)
        .first()
      // console.log(server)
      if (server) {
        // console.log(socket.id)
        // Redis.set(`ws:`)
        request.server = server
      }
      // console.log(user)
    }
    await next()
  }
}

module.exports = AuthServer
