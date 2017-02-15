var mongoose = require('mongoose')
var Schema = mongoose.Schema

var EmailSchema = new Schema({
  created_by: String,
  emailSended: [
    {
      id: {type: Schema.Types.ObjectId, ref: 'User'},
      message: String,
      subject: String,
      dateOfSending: Date
    }
  ]
})

module.exports = mongoose.model('Emails', EmailSchema)
