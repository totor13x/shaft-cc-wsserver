const Event = use('Event')


const RouletteEvent = use('App/Listeners/RouletteEvent')
Event.on('roulette::drop', async (data) => {
  await RouletteEvent.onDrop(data)
})
