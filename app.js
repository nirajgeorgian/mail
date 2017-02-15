const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const ejs = require('ejs')
const engine = require('ejs-mate')
var session = require('express-session')
var cookieParser = require('cookie-parser')
var flash = require('express-flash')
var MongoStore = require('connect-mongo/es5')(session)
var passport = require('passport')
var secret = require('./config/secret')
var app = express()

// app.set('trust proxy', 1) // trust first proxy

app.engine('ejs', engine)
app.set('view engine', 'ejs')


//mongodb configuration
mongoose.connect(secret.database, (err) => {
  if (err) return err;
  console.log("Connecting to database succeded")
})

//using middleware
app.use(express.static(path.join(__dirname, 'public')))
app.use(morgan('dev'))
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secret.secretKey,
  store: new MongoStore({url: secret.database, autoreconnect: true})
}))
app.use(flash())
app.use(function(err,req, res, next) {
  if (err) {
    res.json(res.status(500).send({
      "Error": err.stack
    }))
  }
  res.locals.user = res.user
  next()
})
app.use(passport.initialize())
app.use(passport.session())
app.use((req, res, next) => {
  res.locals.user = req.user
  next()
})
//Routes
var mainRoute = require('./routes/index')
var routerRoute = require('./routes/user')
var tagsRoute = require('./routes/tags')
var singleUserRoutes = require('./routes/singleUser')
app.use(routerRoute)
app.use(mainRoute)
app.use(tagsRoute)
app.use(singleUserRoutes)

app.listen(secret.port, (err) => {
  if (err) return err;
  console.log("Running on 127.0.0.1:"+secret.port)
})
