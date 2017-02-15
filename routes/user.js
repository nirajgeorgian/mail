var router = require('express').Router()
var passport = require('passport')
var passportConfig = require('../config/passport')
var nodemailer = require('nodemailer')
var async = require('async')
var crypto = require('crypto')
var User = require('../model/user')
var Tags = require('../model/tags')
var sgTransport = require('nodemailer-sendgrid-transport')
var moment = require('moment')
var Emails = require('../model/mail')

var options = {
  auth: {
    api_key: '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'
  }
}
var smtpTransport = nodemailer.createTransport(sgTransport(options));


router.post('/user/addnote', (req, res, next) => {
  User.findOne({_id: req.user._id}, (err, user) => {
    if (err) return next(err)
    var date = Date.now()
    var message = req.body.message
    var subject = req.body.subject
    var date = req.body.date
    User.findById({_id: req.user._id}, (err) => {
      if (err) return next(err)
      user.tasks.push({
        date: new Date(date),
        subject: subject,
        task: message
      })
      user.save((err, data) => {
        if (err) return next(err)
        res.redirect('/user/'+user.username)
      })
    })
    })
  })


router.route('/api/users')
.get((req, res, next) => {
  if(!req.user) {
    return res.redirect('/login')
  } else {
    User.find({}, (err, users) => {
      if (err) return next(err)
      res.json(users)
    })
  }
})

router.route('/login')
.get((req, res) => {
  if (req.user) return res.redirect('/')
  res.render('forms/login', {
    message: req.flash('loginMessage'),
    success: req.flash('success'),
    info: req.flash('info')
  })
})
.post(passport.authenticate('local-login', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

router.route('/addadmin')
.get((req, res) => {
  res.render('forms/signup', {
    errors: req.flash('errors')
  })
})
.post((req, res, next) => {
  var user = new User()
  var mail = new Emails()
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex')
        done(err, token)
      })
    },
    function(token, done) {
      user.first_name = req.body.first_name
      user.last_name = req.body.last_name
      user.email = req.body.email
      user.password = req.body.password
      user.username = req.body.username
      user.confirm = false

      User.findOne({email: req.body.email}, (err, userExists) => {
        // if (err) return err;
        if (userExists) {
          req.flash('errors',"Account with that email address already exists")
          return res.redirect('/addadmin')
        } else {
          mail.created_by = req.body.email
          mail.save(function(err, data) {
            if (err) return next(err)
            user.confirm_code = token
            user.save((err, user) => {
              done(err, token, user)
              req.flash("success", "Successfully created your profile")
            })
          })
        }
      })
    },
    function(token, user,done) {
      var mailOptions = {
        to: user.email,
        from: 'nirajgeorgian01@gmail.com',
        subject: 'Account confirmation code',
        text: 'Please click on the link below to activate your account \n'+
        'http://'+req.headers.host+'/activate/'+ token+ '\n\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash("success", "An confirmation email was sended to "+ user.email+".")
        // res.redirect('/login')
        done(err, 'done')
      })
    }
  ], function(err) {
    if (err) return next(err)
    res.redirect('/addadmin')
  })
})

router.route('/profile')
.get((req, res, next) => {
  User.findOne({ _id: req.user._id}, (err, user) => {
    if (err) return next(err)
    res.render('forms/profile', {user: user})
  })
})

router.get('/signout', (req, res, next) => {
  req.logout()
  res.redirect('/login')
})


router.route('/forgot')
.get((req,res) => {
  res.render('forms/forgot', {
    error: req.flash('error')
  })
})
.post((req, res, next) => {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20,(err, buf) => {
        if (err) throw err
        var token = buf.toString('hex')
        done(err, token)
      })
    },
    function(token, done) {
      User.findOne({email: req.body.email}, (err, user) => {
        if (!user) {
          req.flash('error', "No account found for "+ req.body.email + " address")
          return res.redirect('/forgot')
        }
        user.resetPasswordToken = token
        user.resetPasswordExpires = Date.now() + 3600000
        user.confirm = false
        user.save((err) => {
          done(err, token,user)
        })
      })
    },
    function(token, user, done) {
      var mailOptions = {
        to: user.email,
        from: 'nirajgeorgian01@gmail.com',
        subject: 'Password reset token',
        text: 'You are receiving this because someone requested password reset \n'+
        'Please click on the link below to reset your password \n'+
        'http://'+req.headers.host+'/reset/'+token+'\n\n'+
        'If you did not requested for password, Please ignore this email. \n\n'
      }
      smtpTransport.sendMail(mailOptions, (err) => {
        if (err){
          return console.log(err)
        } else {
          req.flash('info', "Successfully sended password reset to" + user.email)
          return res.redirect('/login')
        }
        done(err, 'done')
      })
    }
  ],function(error) {
    if (error) return next(error)
    res.redirect('/login')
  })
})

router.route('/reset/:token')
.get((req, res, next) => {
  User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err, user) => {
    if (!user) {
      req.flash('error', "Password reset token is invalid or expired")
      return res.redirect('/forgot')
    }
    res.render('forms/reset', {
      user: req.user,
      error: req.flash('error')
    })
  })
})
.post((req, res) => {
  async.waterfall([
    function(done) {
      User.findOne({resetPasswordToken: req.params.token, resetPasswordToken: {$gt: Date.now()}}, (err, user) => {
        if(!user) {
          req.flash('error', "Password reset token is invalid or has expired")
          return res.redirect('/forgot')
        }
        user.password = req.body.password
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined

        user.save((err) => {
          if (err) return err;
          done(err, user)
        })
      })
    },
    function(user, done) {
      var mailOptions = {
        to: user.email,
        from: 'nirajgeorgian01@gmail.com',
        subject: 'Password reset token',
        text: 'Hello \n\n\n'+
        'Your password for email '+ user.email+ ' has been successfully reset'
      }
      smtpTransport.sendMail(mailOptions, (err) => {
        req.flash('success', "Success, Your password has been reset")
        return res.redirect('/login')
      })
    }
  ],(err) => {
    res.redirect('/login')
  })
})

router.get('/activate/:token',(req, res, next) => {
  User.findOne({confirm_code: req.params.token},(err, user) => {
    if (!user) {
      req.flash("error", "Password verification code is invalid")
      return res.redirect('/code')
    } else {
      user.confirm = true
      user.save((err) => {
        if (err) return next(err)
        res.redirect('/login')
      })
    }
  })
})

router.route('/code')
.get((req, res) => {
  res.render('forms/code')
})

module.exports = router
