'use strict'

const User = use('App/Models/User')

class TestController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
    // console.log(request.server)
    // console.log('join_on')
    // socket.emit('topic', '123')
  }
  onMessage(text) {
    console.log(text)
  }
  onMessageTest(text) {
    console.log(text, 'test')
    this.socket.emit('messageTest', text)
  }
  async onUserPrm ({id, server_id}) {
    let user = await User
      .query()
      .where('id', id)
      .with('roles', (builder) => {
        builder.with('timeable')
        builder.with('serverable')
        builder.whereHas('serverable', (builder) => {
          builder.where('server_id', server_id) 
        }, '>', 0)
      })
      .first()

    console.log(await user.toJSON(), '000')
    this.socket.emit('userPrm', await user.toJSON())
  }
}

module.exports = TestController
