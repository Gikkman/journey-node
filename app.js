/* global __dirname */

//=======================================================
//==    External imports
//=======================================================
var express = require('express');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var helmet = require('helmet');
var bodyParser = require('body-parser');
var passport = require('passport');
var markdown = require('marked');
var https = require('https');

//=======================================================
//==    App config
//=======================================================
var app = express();
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(helmet());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

markdown.setOptions({
    breaks: true
});
app.locals.markdown = markdown;

//=======================================================
//==    Assign globals
//=======================================================
global.appRoot = path.resolve(__dirname + "/");
global.modules = path.resolve(__dirname + "/modules/");
global.http = require("./modules/async_http.js")(https);

//=======================================================
//==    Config
//=======================================================
var _config_mode = process.env.NODE_ENV === "production" ? 'prod' : 'dev';
console.log('--- Server starting. Config mode: ' + _config_mode);
var _config = require("./secret/config.json")[_config_mode];

//=======================================================
//==    Database
//=======================================================
var _mysql = require("./modules/mysql.js")(_config);

//=======================================================
//==    Sessions
//=======================================================
var options = {
    host: _config.mysql_host,
    port: _config.mysql_port,
    user: _config.mysql_user,
    password: _config.mysql_password,
    database: 'sessions'
};
var sessionStore = new MySQLStore(options, _mysql.getPool());

require("./modules/passport")(passport, _mysql, _config);
app.use(session({
    name: 'session',
    secure: true,
    store: sessionStore,
    secret: _config.session_secret,
    resave: false,
    saveUninitialized: false,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}));
app.use(passport.initialize());
app.use(passport.session());

//=======================================================
//==    Routing
//=======================================================
var _router = require('./routes/_router.js')(app, passport, _mysql, _config);

//=======================================================
//==    View enigine
//=======================================================
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//=======================================================
//==    404 handling
//=======================================================
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//=======================================================
//==    Process events
//=======================================================
process.on('uncaughtException', onUncaughtException);
process.on('exit', onExit);
process.on('SIGTERM', process.exit);
process.on('SIGINT', process.exit);
function onUncaughtException(ex) {
    let exception = JSON.parse(ex);

    console.log(JSON.stringify(exception, null, 2));
    process.exit(1);
}
function onExit(code) {
    _mysql.shutdown();
    console.log("--- Shutting down with code " + code);
}

//=======================================================
//==    Error landing
//=======================================================
app.use(function (err, req, res, next) {
    if (err.status === 401) {
        // if we reach a 401, send them to the login page
        res.render('login');
    } else {
        // set locals, only providing error in development
        res.locals.title = err.status || 500;
        res.locals.message = _config.debug ? err.stack : "Location unknown";

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    }
});

//=======================================================
//==    Export
//=======================================================
module.exports = app;
