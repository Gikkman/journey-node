var express = require('express');
module.exports = function (MySQL) {
    var router = express.Router();

    // Fetch dependancies
    var TokenDatabase = require("../modules/token_database.js")(MySQL);
    var GameDatabases = require("../modules/game_databases.js")(MySQL);

    // Fetch handlers
    var submit = require('./api/submit.js')(TokenDatabase, GameDatabases);

    // Api routes
    router.use('/submit', submit);

    return router;
};