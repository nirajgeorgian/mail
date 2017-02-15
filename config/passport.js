var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var User = require('../model/user')

// Serialize passport
passport.serializeUser((user, done) => {
  done(null, user._id)
})

// Deserialize passport user
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user)
  })
})

// middleware
passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, (req, email, password, done) => {
  User.findOne({email: email}, (err, user) => {
    if (err) { return done(err); }
    if (!user) {
      return done(null, false, req.flash('loginMessage', "No user has been found"));
    }
    if (!user.comparePassword(password)) {
      return done(null, false, req.flash('loginMessage', "Oops!, Wrong Password"));
    }
    return done(null, user);
  })
}))

exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  } else {
    res.redirect('/login')
  }
}
