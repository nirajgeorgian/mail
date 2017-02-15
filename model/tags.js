var mongoose = require('mongoose')
var mongoosePaginate = require('mongoose-paginate')
var Schema = mongoose.Schema

var TagsSchema = new Schema({
  tagList: []
})

module.exports = mongoose.model('Tags', TagsSchema)
