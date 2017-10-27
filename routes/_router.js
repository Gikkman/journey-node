const JP_URL = '/tjp';

module.exports = function(App, Passport, MySQL, Config){
	var TokenDatabase 		= require("../modules/token_database.js")(MySQL);
	var SubmissionsDatabase = require("../modules/submissions_database.js")(MySQL);
    var FaqDatabase         = require("../modules/faq_database.js")(MySQL);
    var RaffleDatabase      = require("../modules/raffle_database.js")(MySQL);

	var ajax = require('./ajax.js')(TokenDatabase, SubmissionsDatabase);
	var auth = require('./auth.js')(Passport, JP_URL);

    var index = require('./index.js');
	var submit= require('./submit.js')(TokenDatabase);
    var login = require('./login.js');
    var faq   = require('./faq.js')(FaqDatabase, MySQL);
    var raffle = require('./raffle.js')(RaffleDatabase);

	// default redirect
	App.get('/', (req, res) => {
		res.redirect(JP_URL);
	});

    // general
    App.use('/auth', auth);
    App.use('/ajax', ajax);

	// routes
	App.use(JP_URL,  index);
	App.use(JP_URL + '/submit', submit);
    App.use(JP_URL + '/login',  login);
    App.use(JP_URL + '/faq',  faq);
    App.use(JP_URL + '/raffle', raffle);

    // troll routes
	App.use(JP_URL + '/complaints', (req, res) => res.render('rick'));
	App.use(JP_URL + '/rigged', (req, res) => res.render('rick'));

    App.use(JP_URL + '/gold', (req, res) => res.render('unwary'));
    App.use(JP_URL + '/buy', (req, res) => res.render('unwary'));

};