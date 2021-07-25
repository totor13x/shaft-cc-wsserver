const Env = use('Env')

class TetATetChannel {
  constructor(bot, helper) {
    this.bot = bot
    this.helper = helper

    this.category_name = 'Tet-A-Tet'
    this.channel_name = '[Создать лобби]'

    this.bot.on('ready', () => {
      this.run(bot, helper)
    })
      // .then(guild => console.log(guild.name))
      // .catch(console.error);
    // bot.channels.fetch()
    //   .then((channels) => {
    //     console.log(channels)
    //   })
  }

  async run(bot, helper) {
    await this.createChannel()
    // let channel = guild.channels.create(this.channel_name, {
    //   type: 'voice'
    // })
    // category.

    bot.on('voiceStateUpdate', async (oldMember, newMember) => {
      // console.log(newMember)
      // console.log(newMember.channelID, this.channel.id)
      if (newMember.channelID == this.channel.id) {
        let GuildMember = oldMember.member
        // let Channel = oldMember.channel
        // let GuildMember = this.guild.members.cache.find(member => member.id == newMember.id)

        let personalChannel = await this.guild.channels.create(`Лобби ${GuildMember.user.username}`, {
          type: 'voice',
          parent: this.category.id
        })
        // console.log(personalChannel)
        await personalChannel.setParent(this.category)
        // console.log(personalChannel)
        GuildMember.edit({
          channel: personalChannel.id
        })
        // await personalChannel.setParent(this.category.id)
        console.log(GuildMember.user.username, 'entered')
      }
      if (oldMember.channelID) {
        let GuildMember = oldMember.member
        let Channel = oldMember.channel
        // console.log()
        if (Channel.parentID == this.category.id && Channel.name != this.channel_name) {
          if (Channel.members.size == 0) {
            Channel.delete('Последний юзер покинул канал')
          }
        }
        console.log(Channel.name, Channel.parentID, GuildMember.user.username, 'leaved')
      }
    })
  }

  async createChannel () {

    let guild = await this.bot.guilds.fetch(Env.get('BOT_GUILD_SERVE'), false, true)

    // Поиск или создание категории TET-A-TET
    let category = guild.channels.cache
      .filter(chx => chx.type === "category")
      .find(x => x.name === this.category_name)

    if (!category) {
      category = await guild.channels.create(this.category_name, {
        type: 'category'
      })
    } else {
      category = await category.fetch(true)
    }

    let channel = guild.channels.cache
      .filter(chx => chx.type === "voice")
      .find(x => x.name === this.channel_name)

    if (!channel) {
      channel = await guild.channels.create(this.channel_name, {
        type: 'voice',
        parent: category.id
      })
    } else {
      channel = await channel.fetch(true)
    }
    // console.log(channel.parentID, category.id)
    if (channel.parentID != category.id) {
      await channel.setParent(category)
    }

    let channels = guild.channels.cache
      .each(async x => {
        x = await x.fetch(true)
        if (x.parentID == category.id && x.type === "voice" && x.name !== this.channel_name) {
          x.delete('Sync Tet-A-Tet after restart')
        }
      })

    this.guild = guild
    this.channel = channel
    this.category = category
  }
}

module.exports = TetATetChannel
