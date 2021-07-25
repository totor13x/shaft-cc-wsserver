'use strict'
const _ = require('lodash')

const UserService = use('App/Services/UserService')

const Ws = use('Ws')

const UserEvent = exports = module.exports = {}

UserEvent.onFinish = async (data) => {
  data = JSON.parse(data)

  UserService.notifySite(data.user_id, {
    message: 'Трек обработан'
  })

  let user_sockets = await UserService.FindSocketsOnly(data.user_id)

  let socks = _.map(user_sockets, (socket) => `inventory/tracks#${socket}`)
  // console.log(data3)
  const topic = Ws
    .getChannel('inventory/tracks')
    .topic('inventory/tracks')

  if (topic){
    topic.emitTo('updateTrack', {
      track_id: data.track_id
    }, socks)
  }
  // console.log(data)
}
