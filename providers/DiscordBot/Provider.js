'use strict'
const fs = require('fs');
const path = require('path')
const resolve = require('resolve')
const { ServiceProvider } = require('@adonisjs/fold')

let readdirSyncRecursive = null
readdirSyncRecursive = (directory) => {
  let files = [];

  fs.readdirSync(directory).forEach(file => {
    const location = path.join(directory, file);

    // If the file is a directory read it recursively
    if (fs.lstatSync(location).isDirectory()) {
      files = files.concat(readdirSyncRecursive(location));
    } else {
      files.push(location);
    }
  });

  return files;
}
class Provider extends ServiceProvider {
  /**
   * Register all ioc bindings
   */
  register() {
    this.registerHelper()
    this.registerPluginLoader()
    this.registerMessageHandler()
    this.registerScheduler()
    this.registerStartBot()
  }

  /**
   * Register Plugin Loader
   */
  registerPluginLoader() {
    this.app.singleton('DiscordBot/PluginLoader', () => {
      const plugins = this.getPluginsConfig()
      return new (require('./Handlers/PluginLoader'))(plugins)
    })
  }

  /**
   * Register Message Handler
   */
  registerMessageHandler() {
    this.app.singleton('DiscordBot/MessageHandler', () => {
      return new (require('./Handlers/MessageHandler'))()
    })
  }

  /**
   * Register Scheduler
   */
  registerScheduler() {
    this.app.singleton('DiscordBot/Scheduler', () => {
      return new (require('./Handlers/Scheduler'))()
    })
  }

  /**
   * Register helper class
   */
  registerHelper() {
    this.app.singleton('DiscordBot/Helper', () => {
      const Env = this.app.use('Env')
      return new (require('./Handlers/Helper'))(Env.get('BOT_MESSAGE_PREFIX', '!'))
    })
  }

  /**
   * Register bot start
   */
  registerStartBot() {
    // console.log('1234')
    this.app.singleton('DiscordBot/StartBot', () => {
      const Env = this.app.use('Env')
      // console.log('123')
      return new (require('./Handlers/Bot'))().then(bot => {
        this.app.use('DiscordBot/PluginLoader').loadPlugins(bot, this.app.use('DiscordBot/Helper'))
		console.log('loaded bot')
        this.app.singleton('DiscordBot', (app) => {
          return bot
        })
        
        bot.login(Env.get('BOT_TOKEN')).then(() => {
          bot.emit('loaded')
        })

        bot.on('message', message => {
          this.app
            .use('DiscordBot/MessageHandler')
            .handle(message, this.app.use('DiscordBot/PluginLoader'), this.app.use('DiscordBot/Scheduler'))
        })
      })
    })
  }

  /**
   * Return the plugin config
   */
  getPluginsConfig() {
    // const resolveOpts = {
    //   baseDir: process.cwd(),
    //   paths: [process.cwd(), path.join( process.cwd(), '/app/DiscordBot')]
    // }
    // console.log(path.join( process.cwd(), '/app/DiscordBot'))
    const paths = readdirSyncRecursive(path.join( process.cwd(), '/app/DiscordBot'))
      .filter(file => file.endsWith('.js'))
      // .map(require);
    // return require(resolve.sync('bot-plugins.js', resolveOpts))

    return paths
  }
}

module.exports = Provider
