const JP_URL = '/jp';
module.exports = function(App, MySQL){
	var Twitch 		  = require(modules + "/twitch");
	var UserDatabase  = require(modules + "/user_database.js")(MySQL);
	var TokenDatabase = require(modules + "/token_database.js")(MySQL); 

	var index = require('./index.js');
	var users = require('./users.js');
	var auth  = require('./auth.js')(Twitch, UserDatabase, TokenDatabase);
	var submit= require('./submit.js')(TokenDatabase);
	var act   = require('./ajax.js')(TokenDatabase);

	// default redirect
	App.get('/', (req, res) => {
		res.redirect(JP_URL);
	});

	// routes
	App.use(JP_URL,              index);
	App.use(JP_URL + '/auth',    auth);
	App.use(JP_URL + '/users',   users);
	App.use(JP_URL + '/submit',  submit);
	App.use(JP_URL + '/ajax',    act);
}