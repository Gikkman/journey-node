var express = require('express');
module.exports = function (MySQL) {
    var router = express.Router();

    // Fetch dependancies
    var Config = global._config;
    var TokenDatabase = require("../modules/token_database.js")(MySQL);
    var GameDatabases = require("../modules/game_databases.js")(MySQL);

    // Fetch handlers
    var submit = require('./api/submit.js')(TokenDatabase, GameDatabases);
    var journey = require('./api/journey.js')(Config, GameDatabases);

    // Api routes
    router.use('/submit', submit);
    router.use('/journey', journey);

    router.get('/', (req, res) => {
       res.status(200).send("Hello");
    });

    return router;
};