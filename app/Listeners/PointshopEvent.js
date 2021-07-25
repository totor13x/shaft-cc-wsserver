'use strict'

const UserPointshop = use('App/Models/User/Pointshop')
const Redis = use('Redis')
const Ws = use('Ws')

const PointshopEvent = exports = module.exports = {}

PointshopEvent.onPoints = async (data) => {
  data = JSON.parse(data)

  let user_pointshop = await UserPointshop
    .findOrCreate({
      user_id: data.user_id,
      server_id: data.server_id
    })

  let socket = await Redis.get(`ws:server:${data.server_id}`)

  const topic = Ws
    .getChannel('server/pointshop')
    .topic('server/pointshop')

  if (topic){
    topic.emitTo('points', {
      user_id: data.user_id,
      points: user_pointshop.points
    }, [
      `server/pointshop#${socket}`
    ])
  }
}
PointshopEvent.onAddItem = async (data) => {
  data = JSON.parse(data)
  let user_pointshop = await UserPointshop
    .findOrCreate({
      user_id: data.user_id,
      server_id: data.server_id
    })

  let count = await user_pointshop
    .items()
    .getCount()

  let item = await user_pointshop
    .items()
    .where('id', data.item_id)
    .first()

  item = await item.toJSON()

  let socket = await Redis.get(`ws:server:${data.server_id}`)

  const topic = Ws
    .getChannel('server/pointshop')
    .topic('server/pointshop')

  if (topic){
    topic.emitTo('addItem', {
      user_id: data.user_id,
      item: item,
      count: count,
    }, [
      `server/pointshop#${socket}`
    ])
  }
}
