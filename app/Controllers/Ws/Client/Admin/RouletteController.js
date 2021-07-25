'use strict'

const Crate = use('App/Models/Economy/Crate')
const CraftItem = use('App/Models/Economy/Craft/CraftItem')
const PointshopItem = use('App/Models/Economy/Pointshop/PointshopItem')
const TTSItem = use('App/Models/Economy/TTS/TTSItem')
const _ = require('lodash')

const getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
const json_output = (item) => {
  let name = item.id

  if (item.itemable && item.itemable.name) {
    name = item.itemable.name
  }
  return {
    name: name
  }
}

const MorphsList = [
  {
    name: 'PS',
    full_name: 'Pointshop',
    namespace: 'App\\Models\\Economy\\Pointshop\\PointshopItem',
    ORM: PointshopItem,
    srvFilter: true
  },
  {
    name: 'Craft',
    full_name: 'Craft',
    namespace: 'App\\Models\\Economy\\Craft\\CraftItem',
    ORM: CraftItem,
    srvFilter: false
  },
  {
    name: 'TTS',
    full_name: 'This Too Shop',
    namespace: 'App\\Models\\Economy\\TTS\\TTSItem',
    ORM: TTSItem,
    srvFilter: true
  }
]

const CostType = [
  {
    name: 'Поинты',
    type: 'points',
  },
  {
    name: 'Плюшки',
    type: 'buns',
  },
  {
    name: 'Эссенции',
    type: 'essences',
  }
]

class RouletteController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }

  async onCrateList () {
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-ps-items'))) {
			this.socket.close()
			return
		}
	} else {
		this.socket.close()
		return
	}
    let crates = await Crate
      .query()
      .with('servers')
      .fetch()

    crates = await crates.toJSON()

    this.socket.emit('crateList', crates)
  }

  async onLoadItems (data) {
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-ps-items'))) {
			this.socket.close()
			return
		}
	} else {
		this.socket.close()
		return
	}
    let morphs = MorphsList.find(x => x.namespace === data.namespace)
    if (morphs) {
      let crate = await Crate
        .find(data.crate_id)

      await crate.load('servers')
      // console.log(crate)

      let items = morphs.ORM
        .query()

      let servers = await crate.getRelated('servers')
      servers = await servers.toJSON()

      let count = servers.length
      if (count > 0) {
        if (morphs.srvFilter) {
          items
            .whereHas('servers', (builder) => { // Фильтр по серверам
              builder.whereIn('server_id', servers.map(o => o.id))
            }, '>', 0)
        }
      }

      items = await items
        .fetch()

      items = await items.toJSON()

      this.socket.emit('loadItems', items)
    }
  }

  async onAddItem (data) {
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-ps-items'))) {
			this.socket.close()
			return
		}
	} else {
		this.socket.close()
		return
	}
    // let data = MorphsList.find(x => x.data.namespace === namespace)
    let crate = await Crate
      .find(data.crate_id)

    await crate
      .items()
      .create({
        itemable_type: data.namespace,
        itemable_id: data.item_id,
        change: data.change,
        color: '[]', // TODO: Добавить возможность выбора цвета
        is_logging: false, // TODO: Добавить переключатель для логгинга в дс
      })

    this.onCrateOpen(data.crate_id)
  }
  async onEditItem (data) {
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-ps-items'))) {
			this.socket.close()
			return
		}
	} else {
		this.socket.close()
		return
	}
    let crate = await Crate
      .find(data.crate_id)
      // .query()
      // .items()
      // .where('id', data.id)
      // .fetch()

    await crate
      .items()
      .where('id', data.id)
      .update({
        change: data.change,
        color: '[]', // TODO: Добавить возможность выбора цвета
        is_logging: false, // TODO: Добавить переключатель для логгинга в дс
      })
    // console.log(item)
    this.onCrateOpen(data.crate_id)
  }
  async onDeleteItem(data) {
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-ps-items'))) {
			this.socket.close()
			return
		}
	} else {
		this.socket.close()
		return
	}
    let crate = await Crate
      .find(data.crate_id)

    await crate
      .items()
      .where('id', data.item_id)
      .delete()

    this.onCrateOpen(data.crate_id)
  }

  async onCrateOpen (id) {
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-ps-items'))) {
			this.socket.close()
			return
		}
	} else {
		this.socket.close()
		return
	}
    let crate = await Crate
      .query()
      .with('items.itemable')
      .with('servers')
      .where('id', id)
      .first()

    crate = await crate.toJSON()

    let fix_servers = [] // TODO: Потом через мап лучше сделать
    crate.servers.forEach(server => {
      fix_servers.push(server.id)
    })
    crate.servers = fix_servers

    // console.log(crate)
    // console.log(MorphsList)
    this.socket.emit('crateOpen', {
      crate: crate,
      morphs: MorphsList,
      types: CostType
    })
  }
  async onSaveConfig (data) {
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-ps-items'))) {
			this.socket.close()
			return
		}
	} else {
		this.socket.close()
		return
	}
    let crate = await Crate
      .find(data.id)

    crate.name = data.name
    crate.buy_key = data.buy_key
    crate.sell_key = data.sell_key
    crate.buy_case = data.buy_case
    crate.sell_case = data.sell_case
    crate.cost_type = data.cost_type

    crate.save()

    crate.servers()
      .sync(
        data.servers.map(o => o.id)
      )
    // console.log(data)
  }
  async onTestOpenConfig (data) {
    let results = {
      data: {
        cost_common: 0,
        dropped_common: 0,
        loops: 400
      },
      servers: {}
    }
    let crate = await Crate
      .query()
      .with('items.itemable.servers')
      .with('servers')
      .where('id', data.id)
      .first()

    crate = await crate.toJSON()
    // console.log(crate)
    crate.servers.forEach(server => {
      let items = _.filter(crate.items, (item) => {
        return _.some(item.itemable.servers, { id: server.id })
      })

      results.servers[server.id] = {}
      
      let sum = items.reduce((a, b) => a + b.change, 0)
      let itemList = []
      let counterForDrop = 0
      let lastGeneration = null
      for (let epoch = 0; epoch < results.data.loops; epoch++) {

        results.data.cost_common += (crate.buy_case + crate.buy_key)
        // console.log(epoch)
        if (lastGeneration == null) {
          itemList = []
          for (let i = 0; i < 110; i++) {
            let num = getRandomIntInclusive(1, sum)
            let prevCheck = 0
            let itemToPull = false
            items.forEach(item => {
              if (num >= prevCheck && num <= prevCheck + item.change) {
                itemToPull = item
              }
              prevCheck += item.change
            })
            itemList.push(itemToPull)
          }
          lastGeneration = itemList
        } else {
          itemList = lastGeneration
          counterForDrop++
          if (counterForDrop > 20) {
            lastGeneration = null
            counterForDrop = 0
          }
        }
          
        let rand = getRandomIntInclusive(0, 100)
        let itemListCopy = JSON.parse(JSON.stringify(itemList))
        let selected = itemListCopy.splice(rand, 1)[0] 

        if (selected.itemable_type == 'App\\Models\\Economy\\Pointshop\\PointshopItem') {
          if (selected.itemable.price) {
            let num = Number(selected.itemable.price)
            results.data.dropped_common += num
          }
        }
        if (selected.itemable_type == 'App\\Models\\Economy\\TTS\\TTSItem') {
          if (selected.itemable.data.points) {
            let num = Number(selected.itemable.data.points)
            results.data.dropped_common += num
          }
        }
        // if (selected.itemable.data) {
        //   if (selected.itemable.data.points) {
        //     let num = Number(selected.itemable.data.points)
        //     results.data.dropped_common += num
        //   }
        //   results.data.cost_common += (crate.buy_case + crate.buy_key)
        // }

        let { name } = json_output(selected)
        console.log(selected)
        if (!results.servers[server.id][name]) {
          results.servers[server.id][name] = 0
        }
        results.servers[server.id][name]++
      }
    })
    this.socket.emit('testOpenConfig', {
      results
    })
  }
}

module.exports = RouletteController
