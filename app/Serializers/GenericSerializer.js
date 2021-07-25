// Fix _pivot_, __meta__ fields

const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')

class GenericSerializer extends VanillaSerializer {
  // Taken from https://github.com/adonisjs/adonis-lucid/blob/21d42c0d80e7d98397336d55312bcb284925584c/src/Lucid/Serializers/Vanilla.js
  _getRowJSON(modelInstance) {
    const json = modelInstance.toObject()
    this._attachRelations(modelInstance, json)
    this._attachMeta(modelInstance, json)
    delete json.__meta__
    delete json.pivot
    return json
  }
}

module.exports = GenericSerializer
