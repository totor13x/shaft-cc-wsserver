class Ping {
  constructor(bot, helper) {
    this.helper = helper

    this.name = 'Ping'
    this.description = 'ping-pong'

    this.commands = {
      ping: {
        usage: '',
        function: 'onPing',
        description: 'List all available commands',
        permissions: []
      },
    }
  }

  async onPing (message) {
    const msg = await message.channel.send('Pinging...');
    const ping = Math.round(msg.createdTimestamp - message.createdTimestamp);

    if (ping <= 0) {
      return msg.edit('Please try again...');
    }
    // console.log(message)

    return msg.edit(
      `🏓 P${'o'.repeat(Math.ceil(ping / 100))}ng: \`${ping}ms\`\n`
    );
  }
}

module.exports = Ping
