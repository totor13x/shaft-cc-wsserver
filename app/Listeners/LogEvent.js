'use strict'

const LogService = use('App/Services/LogService')
const LogEvent = exports = module.exports = {}

LogEvent.onVoice = async (data) => {
  data = JSON.parse(data)
  // const logService = new LogService()

  LogService.NewLog({
    attrs: {
      user_ids: [ data.user_id ],
      voice: data.voice
    },
    server_id: data.server_id,
    type_id: 'voice_received'
  })
}

LogEvent.onTrackPlay = async (data) => {
  data = JSON.parse(data)
  console.log(data)
  // const logService = new LogService()

  LogService.NewLog({
    attrs: {
      user_ids: [ data.user_id ],
      track_id: data.track_id
    },
    server_id: data.server_id,
    type_id: 'track_play'
  })
}
