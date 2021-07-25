// Remove trash labels
// const _ = require('lodash')
const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla')

class GenericSerializer extends VanillaSerializer {
  // Taken from https://github.com/adonisjs/adonis-lucid/blob/21d42c0d80e7d98397336d55312bcb284925584c/src/Lucid/Serializers/Vanilla.js
  _getRowJSON(modelInstance) {
    const json = modelInstance.toObject()
    this._attachRelations(modelInstance, json)
    this._attachMeta(modelInstance, json)

    // Чистка стандартных данных
    delete json.user_id
    delete json.itemable_type
    delete json.itemable_id
    delete json.created_at
    delete json.updated_at

    // console.log(json)
    // Если предмет является поинтшоповским
    if (json.itemable) {
      if (json.itemable.pointshop_item) {
        json.type = 'ps'
        json.item_id = json.itemable.pointshop_item.id
        json.name = json.itemable.pointshop_item.name
      }
      // Переприсвоение данных для лучшей читаемости массива
      json.data = json.itemable.data
      json.perm_id = json.itemable.id
    }
    // Удаление релейшена
    delete json.itemable

    return json
  }
}

module.exports = GenericSerializer
