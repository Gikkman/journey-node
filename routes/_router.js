const JP_URL = '/tjp';

module.exports = function (App, Passport, MySQL) {

    var TokenDatabase = require("../modules/token_database.js")(MySQL);
    var FaqDatabase = require("../modules/faq_database.js")(MySQL);
    var RaffleDatabase = require("../modules/raffle_database.js")(MySQL);
    var UserDatabase = require("../modules/user_database.js")(MySQL);
    var GameDatabases = require("../modules/game_databases.js")(MySQL);

    // Twitch requires up to do some security lookup if you are logged in
    require("./_twitch_lookup.js")(App, UserDatabase, JP_URL + "/login");

    var api = require('./api.js')(MySQL);
    var auth = require('./auth.js')(Passport, JP_URL);

    var index = require('./index.js');
    var submit = require('./submit.js')(TokenDatabase, GameDatabases);
    var login = require('./login.js');
    var faq = require('./faq.js')(FaqDatabase, MySQL);
    var raffle = require('./raffle.js')(RaffleDatabase);

    // default redirect
    App.get('/', (req, res) => {
        res.redirect(JP_URL);
    });

    // general
    App.use('/auth', auth);
    App.use('/api', api);

    // routes
    App.use(JP_URL, index);
    App.use(JP_URL + '/submit', submit);
    App.use(JP_URL + '/login', login);
    App.use(JP_URL + '/faq', faq);
    App.use(JP_URL + '/raffle', raffle);
};