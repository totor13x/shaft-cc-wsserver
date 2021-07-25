'use strict'

const TestEvent = exports = module.exports = {}

TestEvent.onMessage = async (data) => {
  console.log(data)
}
