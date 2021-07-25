
const Redis = use('Redis')
const Ws = use('Ws')

const Server = use('App/Models/Server')

class UpdateServerOnline {
  static get key() {
    return "UpdateServerOnline-key";
  }


  async handle(job) {
      const topic = Ws
        .getChannel('server/global')
        .topic('server/global')

      if (topic) {
        topic.broadcast('onlinePlayers', {})
	    }

  }
}
module.exports = UpdateServerOnline;
