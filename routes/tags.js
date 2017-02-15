const router = require('express').Router()
var Tags = require('../model/tags')
var User = require('../model/user')

router.route('/tags/edit/:tag')
.get((req, res) => {
  var tags = req.params
  Tags.find({"tagList":tags.tag}, (err, tagData) => {
    if (tagData.length > 0) {
      res.render('forms/edit', {tags: tags})
    } else {
      res.json({
        tagData
      })
    }
  })
})
.post((req, res, next) => {
  var eTags = req.params.tag
  var tag = req.body.tags  //got the data fro inserting into database
  Tags.update({"tagList": eTags},{$set: {'tagList.$': tag}} ,(err, tags) => {
    User.update({"tagList": eTags},{$set: {'tagList.$': tag}}, {multi: true},(err, etags) => {
      if (err) return next(err)
      return res.redirect('/tags')
    })
  })
})

router.route('/api/tags')
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
              return res.redirect('/')
            } else {
              req.flash("failure", "Tag already present")
              return res.redirect('/')
            }
          })
        } else {
          User.findOneAndUpdate(userCondition, update, (err, tags) => {
            if (err) return err
            req.flash("success", "Successfully added tag to the user as well as to tags.")
            return res.redirect('/')
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
              return res.redirect('/')
            } else {
              req.flash("failure", "Tag already present in user but added to tags collection")
              return res.redirect('/')
            }
          })
        } else {
          User.findOneAndUpdate(userCondition, update, (err, tags) => {
            if (err) return err
            req.flash("success", "Successfully added tag to the user as well as to tags.")
            return res.redirect('/')
          })
        }
      })
    }
  })
})

router.route('/tags')
.get((req, res, next) => {
  if(!req.user) {
    res.redirect('/login')
  } else {
    User.find({}, (err, user) => {
      if (err) return err;
      Tags.find({}, (err, tags) => {
        if (err) res.json(err)
        // res.json(tags[0].tagList)
        if (tags.length) {
          var arr1 = tags[0].tagList
          res.render('pages/tags', {
            tags: arr1,
            users: user,
            success: req.flash("success"),
            failure: req.flash("failure")
          })
        } else {
          res.render('pages/tags', {
            tags: '',
            users: user,
            success: req.flash("success"),
            failure: req.flash("failure")
          })
        }
      })
    })
  }
})
.post((req, res, next) => {
  // Tags.findOne()
})

router.route('/tags/add')
.post((req, res, next) => {
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
  Tags.find({}, (err, tags) => {
    if (tags.length != 0) {
      Tags.findOneAndUpdate(condition, update, (err, tags) => {
        if (err) return err;
        if (tags) {
          req.flash("success", "Successfully added your tag")
          return res.redirect('/tags')
        } else {
          req.flash("failure", "The tag is already present in your tags.")
          return res.redirect('/tags')
        }
      })
    } else {
      Tags.findOneAndUpdate(condition, update, {upsert: true}, (err, tags) => {
        if (err) return err;
        if (!tags) {
          req.flash("success", "Successfully added your tag")
          return res.redirect('/tags')
        } else {
          req.flash("failure", "The tag is already present in your tags.")
          return res.redirect('/tags')
        }
      })
    }
  })
})

router.route('/tags/delete/:tag_name')
.get((req, res, next) => {
  var tagName = req.params.tag_name;
  Tags.update({}, {$pull:{tagList: {$in: [tagName]}}},(err, deleted) => {
    if (err) return next(err)
    User.update({}, {$pull: {tagList: {$in: [tagName]}}}, (err, deleted) => {
      if (err) return next(err)
      if (deleted) {
        req.flash("success", "successfully deleted you tag")
        res.redirect('/tags')
      } else {
        res.json("failure")
      }
    })
  })
})

module.exports = router
