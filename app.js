/* global __dirname */

//=======================================================
//==    External imports
//=======================================================
var express = require('express');
var session  = require('express-session');
var cookieParser = require('cookie-parser');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var helmet = require('helmet');
var bodyParser = require('body-parser');
var passport = require('passport');

//=======================================================
//==    App config
//=======================================================
var app = express();
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static( path.join(__dirname, 'public')));

//=======================================================
//==    Assign globals
//=======================================================
global.appRoot = path.resolve(__dirname+"/");
global.modules = path.resolve(__dirname+"/modules/");

//=======================================================
//==    Config
//=======================================================
var _config_mode = process.env.NODE_ENV === "production" ? 'prod' : 'dev';
console.log(_config_mode);
var _config = require("./config.json")[_config_mode];

//=======================================================
//==    Database
//=======================================================
var _mysql  = require("./modules/mysql.js")(_config);

//=======================================================
//==    Sessions
//=======================================================
require("./modules/passport")(passport, _mysql, _config); //Configure passport
app.use(session({
	secret: _config.session_secret,
	resave: true,
	saveUninitialized: true
 } ));
app.use(passport.initialize());
app.use(passport.session());

//=======================================================
//==    Routing
//=======================================================
var _router = require('./routes/_router.js')(app, passport, _mysql, _config);

//=======================================================
//==    View enigine
//=======================================================
app.set('views', path.join( __dirname, 'views'));
app.set('view engine', 'jade');

//=======================================================
//==    404 handling
//=======================================================
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//=======================================================
//==    Error handling
//=======================================================
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.title = err.status || 500;
  res.locals.message = _config.debug ? err.stack : "Location unknown";

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//=======================================================
//==    Process events
//=======================================================
process.on('uncaughtException', onUncaughtException);
process.on('exit', onExit);
process.on('SIGTERM', process.exit);
process.on('SIGINT',  process.exit);
function onUncaughtException(ex) {
  console.log(ex);
  process.exit(1);
}
function onExit(code) {
  _mysql.shutdown();
  console.log("Shutting down with code " + code );
}

//=======================================================
//==    Export
//=======================================================
module.exports = app;
