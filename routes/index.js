const router = require('express').Router()
const User = require('../model/user')
var Emails = require('../model/mail')
var nodemailer = require('nodemailer')
var sgTransport = require('nodemailer-sendgrid-transport')

var options = {
  auth: {
    api_key: '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'
  }
}
var smtpTransport = nodemailer.createTransport(sgTransport(options));

function page(req, res, next) {
  var perPage = 10;
  var page = req.params.page;
  User
    .find()
    .skip(perPage * page)
    .limit(perPage)
    .exec(function(err, user) {
      if (err) return next(err)
      User.count().exec(function(err, count) {
        if (err) return next(err)
        res.render('pages/index', {
          users: user,
          singleUser: req.user,
          pages: parseInt(count/perPage),
          currentPage: 1,
          success: req.flash("success"),
          failure: req.flash("failure")
        })
      })
    })
}

router.get('/', (req, res, next) => {
  if (!req. user) {
    return res.redirect('/login')
  } else {
    page(req, res, next)
  }
})

router.get('/users/:page', (req, res, next) => {
  page(req, res, next)
})

router.post('/user/sendmail', (req, res, next) => {
  var subject = req.body.subject
  var message = req.body.message
  var toUser = req.user.email
  User.findOne({email: req.user.email}, (err, userFound) => {
    if (err) return next(err)
    mailOptions = {
      to: toUser,
      from: 'nirajgeorgian01@gmail.com',
      subject: subject,
      text: message
    }
    smtpTransport.sendMail(mailOptions, (err, sended) => {
      if (err) return next(err)
      // var mail = new Mail()
      Emails.findOne({created_by: req.user.email}, (err, foundMail) => {
        if (err) return next(err)
        foundMail.emailSended.push({
        id: req.user._id,
        message: message,
        subject: subject,
        dateOfSending: Date.now()
        })
        foundMail.save((err, sended) => {
          if (err) return next(err)
          req.flash("success", "successfully sended your mail")
          res.redirect('/user/'+req.user.username)
        })

      })
     })
  })
})

module.exports = router
