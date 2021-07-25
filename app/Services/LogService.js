'use strict'

const Log = use('App/Models/Core/Log')
const User = use('App/Models/User')
const Track = use('App/Models/Economy/Track')
const Redis = use('Redis')
const Ws = use('Ws')

class LogService {
  static async FormatArgs (log) {
    let output = {}
    output.id = log.id
    output.server_id = log.server_id
    output.created_at = log.created_at
    if (log.type) {
      output.format = log.type.string
    } else {
      output.type = log.type_id
    }
    let user_ids = []
    if (log.attrs) {
      if (log.attrs.user_ids) {
        log.attrs.user_ids.forEach(id => {
          user_ids.push(id)
        });
      }
    }
    let new_user_ids = [...new Set(user_ids)]

    let users = await User
      .query()
      .select(['id', 'steamid', 'avatar', 'username'])
      .whereIn('id', new_user_ids)
      .fetch()

    users = await users.toJSON()
    let fast = {}
    users.forEach(async user => {
      fast[user.id] = user
      let online = await Redis.get(`ws:user:${user.id}:online`)
      fast[user.id].online = online
    });
    // console.log(users)
    // let inc = 0
    let incr = 0
    if (log.attrs) {
      output.attrs = {}
      if (log.attrs.user_ids) {
        log.attrs.user_ids.forEach(id => {
          if (fast[id]) {
            output.attrs[':user_id-'+ incr] = fast[id]
            incr++
          }
        });
        delete log.attrs["user_ids"];
      }
	  if (log.attrs.track_id) {
		   let track = await Track
			  .find(log.attrs.track_id)
			  // .select(['id', 'path', 'system', 'user_id'])
			  // .where('id', log.attrs.track_id)
			  // .first()
			 track = await track.toJSON()
		let user_track = await User
		  .query()
		  .select(['id', 'steamid', 'avatar', 'username'])
		  .where('id', track.user_id)
		  .first()
		  // console.log(track.cdn_path)
		log.attrs.audio = track.cdn_path
		log.attrs.track_name = track.track_name
		log.attrs.track_author = track.track_author
		// console.log(track)
		  fast[user_track.id] = user_track
		  let online = await Redis.get(`ws:user:${user_track.id}:online`)
		  fast[user_track.id].online = online
		output.attrs[':user_id-'+ incr] = user_track
		incr++
		// log.attrs.user = track.cdn_path
	  }
      Object.keys(log.attrs).forEach(id => {
        const attr = log.attrs[id]
        output.attrs[`:${id}`] = attr
      })
    }

    if (output.format) {
      let out = output.format
      let reformat = ''
      if (out.search(':user_ids') !== -1) {
        let text = ':user_ids'
        let matched = out.search(text)

        let first = out.substr(0, matched)
        let end = out.substr(matched + text.length)
        // console.log(`'${first}'`, `'${end}'`, incr - 1)

        reformat += first
        let users_tags = []
        for (let index = 1; index < incr; index++) {
          users_tags.push(`:user_id-${index}`)
        }

        reformat += users_tags.join(', ')
        // for (let ii=0; incr - 1; ii++) {
        //   reformat += `:user_id-${ii},`
        // }

        reformat += end
        output.format = reformat
        // console.log(reformat)
        // if (this.toCopy) {
        //   textY += strE.substr(0, strE.search(match))
        // }
        // strE = strE.substr(strE.search(match) + match.length)
      }
    }

    return output
  }

  static async NewLog (data) {

    let log = new Log
    log.attrs = data.attrs
    log.server_id = data.server_id
    log.type_id = data.type_id
    await log.save()

    // let this_log = log.id

    this.onUpdateID(log.id)
  }
  static async onUpdateID (id) {
    let data = await Log
      .query()
      .with('type')
      .with('server')
      .where('id', id)
      .first()

    data = await data.toJSON()
    data = await this.FormatArgs(data)

    const topic = Ws
      .getChannel('client/logs')
      .topic('client/logs')

    if (topic){
      topic.broadcast('new_log', data)
    }
  }
}

module.exports = LogService
