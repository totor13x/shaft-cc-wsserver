'use strict'

const ChatGlobal = use('App/Models/ChatGlobal')
const User = use('App/Models/User')
const { validate } = use('Validator')
const Ws = use('Ws')
const Redis = use('Redis')

class ChatGlobalController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request

    let messages = ChatGlobal
      .query()
      .with('user', (builder) => {
        if (this.request.server) {
          builder.setHidden([
            'last_parse_websteamapi_at',
            'password',
            'api_token',
            'avatar',
            'updated_at',
            'created_at',
            'email_verified_at',
            'email'
          ])
        }
      })
      .orderBy('created_at', 'desc')
      .limit(20)
      .fetch()

    messages.then(res => {
      this.socket.emit('load', res.toJSON())
    })

    socket.on('close', () => {
      this.onChatUsers()
    })

    setTimeout(() => {
      this.onChatUsers()
    }, 100)
  }
  async onServerMessage (data) {
    let user = await User.find(data.user_id)
    this.request.user = user
    console.log(data)
    await this.onMessage(data.message)

    this.request.user = null
  }
  async onMessage (message) {
    const rules = {
      message: 'required|min:2|max:255'
    }
    const messages = {
      required: 'Поле необходимо заполнить',
      min: 'Для отправки сообщения должно быть минимум 2 символа',
      max: 'Для отправки сообщения должно быть максимум 255 символов'
    }

    const validation = await validate({ message: message }, rules, messages)

    if (validation.fails()) {
      this.socket.emit('errors', validation.messages())
      console.log(validation.messages())
      return
    }

    if (!this.request.user) {
      this.socket.emit('errors', ['Необходимо авторизоваться'])
      return
    }

    const is_gc = await this.request.user.is_gc()
    console.log(is_gc, 'is_gc')
	  if (is_gc) {
      this.socket.emit('errors', ['Вам отключен глобальный чат'])
	    return
	  }
    let messag = await new ChatGlobal()
    messag.message = message
    messag.user_id = this.request.user.id
    messag.tag_id = this.request.user.tag_id
    await messag.save()

    await messag.load('user')

    const topic = Ws
      .getChannel('chat')
      .topic('chat')

    if (topic) {
      topic.broadcast('message', messag.toJSON())
    }
    // console.log(validation, message)
  }

  async onChatUsers () {
    const topicSubs = Ws
      .getChannel('chat')
      .getTopicSubscriptions('chat')

    let userIds = []

    if (topicSubs) {
      for (const fd of topicSubs) {
        let userId = await Redis.get(`ws:fds:${fd.connection.id}`)
        console.log(userId, 'Redis')
        if (userId) {
          console.log(userId, 'Redis pushed')
          userIds.push(userId)
        }
      }
    }
    // console.log(userIds, 'Await')
    const users = await User
      .query()
      .select(['id', 'steamid', 'avatar', 'username'])
      .whereIn('id', userIds)
      .fetch()

    // console.log(users)

    const topic = Ws
      .getChannel('chat')
      .topic('chat')

    const usersFormat = await users.toJSON()
    for (let user of usersFormat) {
      let online = await Redis.get(`ws:user:${user.id}:online`)
      user.online = online
    }
    if (topic) {
      topic.broadcast('users', usersFormat)
    }
  }
}

module.exports = ChatGlobalController
