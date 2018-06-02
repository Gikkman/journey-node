var express = require('express');

module.exports = function (MySQL) {
    var router = express.Router();

    // Fetch dependancies
    var TokenDatabase = require("../modules/token_database.js")(MySQL);
    var GameDatabases = require("../modules/game_databases.js")(MySQL);
    var SiteMessageDB = require("../modules/site_message_database.js")();

    // Fetch handlers
    var submit = require('./api/submit.js')(MySQL, TokenDatabase, GameDatabases);
    var journey = require('./api/journey.js')(MySQL, GameDatabases, SiteMessageDB);

    // Api routes
    router.use('/submit', submit);
    router.use('/journey', journey);

    router.get('/', (req, res) => {
       res.status(200).send("Hello");
    });

    return router;
};