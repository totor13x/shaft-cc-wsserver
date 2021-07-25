'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const User = use('App/Models/User')
const Redis = use('Redis')

class AuthUser {

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async wsHandle ({ socket, request }, next) {
    // call next to advance the request
    const token = request.input('api_token')
    // console.log(token, token !== null)
    if (token)
    {
      let user = await User
        .query()
        .where('api_token', token)
        .first()

      if (user) {
        // console.log(socket.id)
        // Redis.set(`ws:`)
        request.user = user
      }
      // console.log(user)
    }
    await next()
  }
}

module.exports = AuthUser
