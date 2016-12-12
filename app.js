var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var helmet = require('helmet');
var bodyParser = require('body-parser');

var app = express();
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.static( path.join(__dirname, 'public')));

global.appRoot = path.resolve(__dirname+"/");
global.modules = path.resolve(__dirname+"/modules/");

var _config = require("./config.json")[process.env.JOURNEY_CONFIG];
var _mysql  = require("./modules/mysql.js")(_config);
var _router = require('./routes/_router.js')(app, _mysql);

// view engine setup
app.set('views', path.join( __dirname, 'views'));
app.set('view engine', 'jade');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.title = err.status || 500;
  res.locals.message = _config.debug ? err.stack : "Location unknown";

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

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

module.exports = app;
