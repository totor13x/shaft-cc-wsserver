'use strict'

const Ws = use('Ws')
const User = use('App/Models/User')

const AdminEvent = exports = module.exports = {}

AdminEvent.onRefreshLocks = async (data) => {
  data = JSON.parse(data)

  let user = await User
    .query()
    .with('locks')
    .where('id', data.user_id)
    .first()

  if (user) {
    user = await user.toJSON()
    let locks = user.locks

    let output = {}

    locks.forEach(lock => {
      output[lock.type] = lock
    })

    const topic = Ws
      .getChannel('server/admin')
      .topic('server/admin')

    if (topic) {
      topic.broadcast('refreshLocks', {
        // id: user.id,
        user_id: user.id,
        locks: output
      })
    }
  }
}
