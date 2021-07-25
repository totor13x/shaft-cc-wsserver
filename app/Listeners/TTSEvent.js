'use strict'

const moment = require('moment')
const _ = require('lodash')

const UserService = use('App/Services/UserService')
const User = use('App/Models/User')

const Ws = use('Ws')

const TTSEvent = exports = module.exports = {}

TTSEvent.onFillBalance = async (data) => {
    data = JSON.parse(data)
  
    UserService.notifyAllServers(data.user_id, {
      message: 'Баланс пополнен'
    })
  
    UserService.UpdateTTSBalance(data.user_id)
}
TTSEvent.onRefreshPremium = async (data) => {
  data = JSON.parse(data)

  const user = await User.find(data.user_id)

  const is_premium = await user.is_premium()
  const datepremium_at = is_premium ? moment(user.premium_at).format('X') : null

  
  const topic = Ws
    .getChannel('users')
    .topic('users')

  if (topic){
    topic.broadcast('refreshPremium', {
      user_id: data.user_id,
      is_premium: is_premium,
      premium_at: datepremium_at
    })
  }
}
TTSEvent.onRefreshBalance = async (data) => {
    data = JSON.parse(data)

    UserService.UpdateTTSBalance(data.user_id)
}
