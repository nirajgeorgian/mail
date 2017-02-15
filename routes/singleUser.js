var router = require('express').Router()
var User = require('../model/user')
var Tags = require('../model/tags')
var Emails = require('../model/mail')
var moment = require('moment')

router.get('/user/:username', (req, res, next) => {
  if(!req.user) {
    res.redirect('/login')
  } else {
    User.findOne({"username": req.params.username}, (err, user) => {
      if (err) return next(err)
      var dateAdded = moment(user.tasks.date)
      Emails.find({created_by: user.email}, (err, email) => {
        if (err) return next(err)
        // res.json(email[0].emailSended)
        res.render('pages/user',{
          user: user,
          moment: moment,
          email: email[0].emailSended,
          date: dateAdded.format('D MMM YYYY'),
          success: req.flash("success"),
          failure: req.flash("failure")
        })
      })
    })
  }
})

router.route('/user/tags')
.get((req, res) => {
  Tags.find({}, (err, tag) => {
    if (err) return err
    res.json(tag)
  })
})
.post((req, res) => {
  var tags = this
  tags.tagList = req.body.tagList
  // Lookup for the tag if it exists
  var condition = {
    tagList: {
      $ne: req.body.tagList
    }
  }
  var update = {
    $addToSet: {
      tagList: req.body.tagList
    }
  }
  var userCondition = {
    tagList: {
      $ne: req.body.tagList
    },
    email: req.body.email
  }
  Tags.find({}, (err, data) => {
    if (data.length != 0) {
      Tags.findOneAndUpdate(condition, update, (err, tags) => {
        if (err) return err;
        if (!tags) {
          User.findOneAndUpdate(userCondition, update,(err, tags) => {
            if (err) return next(err)
            if (tags) {
              req.flash("success", "Successfully added tag to the user")
              return res.redirect('/user/'+req.body.username)
            } else {
              req.flash("failure", "Tag already present")
              return res.redirect('/user/'+req.body.username)
            }
          })
        } else {
          User.findOneAndUpdate(userCondition, update, (err, tags) => {
            if (err) return err
            req.flash("success", "Successfully added tag to the user as well as to tags.")
            return res.redirect('/user/'+req.body.username)
          })
        }
      })
    } else {
      // Adding tag to the user
      Tags.findOneAndUpdate(condition, update, {upsert: true}, (err, tags) => {
        if (err) return err;
        if (!tags) {
          User.findOneAndUpdate(userCondition, update,(err, tags) => {
            if (err) return err
            if (tags) {
              req.flash("success", "Successfully added tag to the user")
              return res.redirect('/user/'+req.body.username)
            } else {
              req.flash("failure", "Tag already present in user but added to tags collection")
              return res.redirect('/user/'+req.body.username)
            }
          })
        } else {
          User.findOneAndUpdate(userCondition, update, (err, tags) => {
            if (err) return err
            req.flash("success", "Successfully added tag to the user as well as to tags.")
            return res.redirect('/user/'+req.body.username)
          })
        }
      })
    }
  })
})

router.get('/api/email', (req, res, next) => {
  if(!req.user) {
    res.redirect('/login')
  } else {
    Emails.findOne({created_by: req.user.email}, (err, mails) => {
      if (err) return next(err)
      res.json(mails)
    })
  }
})

module.exports = router








































//all the page
