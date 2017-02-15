var mongoose = require('mongoose')
var bcrypt = require('bcrypt-nodejs')
// mongoose.Promise = require('mongoose')
var mongoosePaginate = require('mongoose-paginate')
var Schema = mongoose.Schema

var UserSchema = new Schema({
  first_name: {type: String, lowercase: true},
  last_name: {type: String, lowercase: true},
  username: {type: String, required: true, unique: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  created_at: Date,
  updated_at: Date,
  tagList: [],
  tag_mail_sended: Boolean,
  last_mail: Date,
  confirm: Boolean,
  confirm_code: String,
  admin: Boolean,
  tasks: [
    {
      date: Date,
      subject: String,
      task: {type: String, required: true}
    }
  ]
})

UserSchema.pre('save', function(next) {
  var currentDate = new Date();
  //update the updated at
  this.updated_at = currentDate
  //change the created at if it is for the first time
  if(!this.created_at) {
    this.created_at = currentDate
  }
  this.admin = false
  var user = this
  // Hash the Password
  if(!user.isModified('password')) return next()
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err)
    bcrypt.hash(user.password,salt,null, (err, hash) => {
      if (err) return err
      user.password = hash
      next()
    })
  })
})

UserSchema.methods.comparePassword = function(password) {
  return bcrypt.compareSync(password, this.password)
}

UserSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('User', UserSchema)
