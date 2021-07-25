'use strict'

/*
|--------------------------------------------------------------------------
| Websocket
|--------------------------------------------------------------------------
|
| This file is used to register websocket channels and start the Ws server.
| Learn more about same in the official documentation.
| https://adonisjs.com/docs/websocket
|
| For middleware, do check `wsKernel.js` file.
|
*/

const Ws = use('Ws')

  Ws.channel('global', 'GlobalController')
  Ws.channel('inventory/tracks', ({ socket }) => { })
  Ws.channel('chat', 'ChatGlobalController')
  Ws.channel('test', 'TestController')
  // Server Controllers
  Ws.channel('users', 'Server/UserController')
  Ws.channel('client/logs', 'Client/LogsController') // Здесь без мидла, потому что все внутри разделено
  Ws.channel('client/admin/roulette', 'Client/Admin/RouletteController').middleware(['can:ap-mng-ps-items']) // Проблема в том, что ключа для прав рулеткой - нет
  Ws.channel('client/admin/tags', 'Client/Admin/TagsController')

  Ws.channel('server/roulette', 'Server/RouletteController')
  Ws.channel('server/global', 'Server/GlobalController')
  Ws.channel('server/pointshop', 'Server/PointshopController')
  Ws.channel('server/online', 'Server/OnlineController')
  Ws.channel('server/logs', 'Server/LogsController')
  Ws.channel('server/admin', 'Server/AdminController')
  Ws.channel('server/trade', 'Server/TradeController')
  Ws.channel('server/inventory', 'Server/InventoryController')
