const JP_URL = '/tjp';

var URL = require("url");

module.exports = function(App, Passport, MySQL, Config){
	var TokenDatabase 		= require("../modules/token_database.js")(MySQL); 
	var SubmissionsDatabase = require("../modules/submissions_database.js")(MySQL);

	var ajax = require('./ajax.js')(TokenDatabase, SubmissionsDatabase);
	var auth = require('./auth.js')(Passport, JP_URL);
    
    var index = require('./index.js');
	var submit= require('./submit.js')(TokenDatabase, MySQL);
    var login = require('./login.js');

	// default redirect
	App.get('/', (req, res) => {
		res.redirect(JP_URL);
	});
    App.use('/auth', auth);
    App.use('/ajax', ajax);

	// routes
	App.use(JP_URL,  index);
	App.use(JP_URL + '/submit', submit);
    App.use(JP_URL + '/login',  login);
	

    // ==============================================================
	// TWITCH LOGIN 
	// ==============================================================
	
};