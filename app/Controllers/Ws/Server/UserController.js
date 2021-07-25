'use strict'

const User = use('App/Models/User')
const crypto = require('crypto')
const moment = require('moment')
const UserService = use('App/Services/UserService')
const PointshopController = use('App/Controllers/Ws/Server/PointshopController')
const _ = require('lodash')
class UserController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }

  async onGetInfo (data) {
    let user = await User
      .query()
      .where('steamid', data.steamid)
      .first()

    if (!user) {
      var hash = crypto.randomBytes(30).toString('hex'); // Выходит 60 символов
      user = await new User
      user.api_token = hash
      user.username = data.username
      user.steamid = data.steamid
      await user.save()
    }

    user = await User
      .query()
      .where('steamid', data.steamid)
      .with('locks')
      .with('tags')
      .with('roles', (builder) => {
        builder
          // .with('timeable')
          .with('role.permissions')
          .whereHas('serverable', (builder) => {
            builder.where('server_id', this.request.server.id)
          }, '>', 0)
      })
      .with('permissions', (builder) => {
        builder
          // .with('timeable')
          .with('permission')
          .whereHas('serverable', (builder) => {
            builder.where('server_id', this.request.server.id)
          }, '>', 0)
      })
      .setVisible(['id', 'steamid', 'api_token', 'server_data', 'tag_id'])
      .first()

    const tts_balance = await user.tts_balance()
	  const is_premium = await user.is_premium()
    const datepremium_at = is_premium ? moment(user.premium_at).format('X') : null
    user = await user.toJSON()
    if (user.roles) { 
      user.roles = _.map(user.roles, (o) => {
        if (o.role) {
          const perms = _.map(o.role.permissions, (a) => {
            return {
              slug: a.slug
            }
          })
          return {
            role: {
              name: o.role.name,
              immunity: o.role.immunity,
              slug: o.role.slug,
              permissions: perms
            }
          }
        } else {
          return {}
        }
      })
    }
    
    if (user.tags) {
      user.tags = _.map(user.tags, (o) => {
        return {
          id: o.id,
          text: o.beautiful_text
        }
      })
    }

    this.socket.emit('getInfo', {
      ...user,
      tts_balance: tts_balance,
	    is_premium: is_premium,
      premium_at: datepremium_at
    })
  }

  async onChangeTag (data) {
    let user = await User
      .query()
      .where('id', data.user_id)
      .first()
      
    if (data.tag_id == '') {
      user.tag_id = null
    } else {
      let tag = await user
        .tags()
        .wherePivot('tag_id', data.tag_id)
        .first()
      
      if (tag) {
        user.tag_id = tag.id
      }
    }

    await user.save()

    UserService.notifyOnServer(
      user.id,
      this.request.server.id,
      {
        message: `Тег обновлен`,
        length: 3,
        type: 0
      }
    )

    this.socket.emit('refreshTag', {
      tag_id: data.tag_id,
      user_id: user.id
    })
  }

  async onTtsBalance (data) { 
    let user = await User
      .query()
      .where('steamid', data.steamid)
      .first()
    if (user) {
      const tts_balance = await user.tts_balance()
      this.socket.emit('ttsBalance', {
        steamid: data.steamid,
        balance: tts_balance
      })
    }
  }
  // async onGetItems (data) {
  //   console.log(data)
    // let user = await User
    //   .query()
    //   .where('steamid', data.steamid)
    //   .first()

    // .query()
    // .where('id', id)
    // .with('roles', (builder) => {
    //   builder.with('timeable')
    //   builder.with('serverable')
    //   builder.whereHas('serverable', (builder) => {
    //     builder.where('server_id', server_id)
    //   }, '>', 0)
    // })
    // .first()

    // this.socket.emit('getItems', user)
  // }
}

module.exports = UserController
