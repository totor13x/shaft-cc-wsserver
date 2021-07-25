'use strict'
const Ws = use('Ws')

class ChatController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }
  async message (message) {

    const topic = Ws
      .getChannel('chat')
      .topic('chat')
      
    if (topic){
      topic.broadcast('message', `${socket.id}: ${message}`)
    }
  }
}

module.exports = ChatController
