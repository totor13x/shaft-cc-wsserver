const Env = use('Env')

class RolesLoading {
  constructor(bot, helper) {
    this.bot = bot
    this.helper = helper

    // this.category_name = 'Tet-A-Tet'
    // this.channel_name = '[Создать лобби]'

    this.bot.on('ready', () => {
      // this.run(bot, helper)
    })
      // .then(guild => console.log(guild.name))
      // .catch(console.error);
    // bot.channels.fetch()
    //   .then((channels) => {
    //     console.log(channels)
    //   })
  }

  async run(bot, helper) {
  }
}


module.exports = RolesLoading
