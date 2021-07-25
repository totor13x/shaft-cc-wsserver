module.exports = {
  apps: [
    {
      name: 'WsApp',
      exec_mode: 'cluster',
      instances: 1,
      script: './server.js'
    }
  ]
}