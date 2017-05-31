const JP_URL = '/tjp';

module.exports = function(App, Passport, MySQL, Config){
	var TokenDatabase 		= require("../modules/token_database.js")(MySQL); 
	var SubmissionsDatabase = require("../modules/submissions_database.js")(MySQL);
    var FaqDatabase         = require("../modules/faq_database.js")(MySQL);

	var ajax = require('./ajax.js')(TokenDatabase, SubmissionsDatabase);
	var auth = require('./auth.js')(Passport, JP_URL);
    
    var index = require('./index.js');
	var submit= require('./submit.js')(TokenDatabase);
    var login = require('./login.js');
    var faq   = require('./faq.js')(FaqDatabase, MySQL);

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
    App.use(JP_URL + '/faq',  faq);
	

    // ==============================================================
	// TWITCH LOGIN 
	// ==============================================================
	
};