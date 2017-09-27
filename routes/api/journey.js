var express = require('express');
module.exports = function (Config, GameDatabases) {
    var router = express.Router();

    router.post('/progress', isAuthenticated, async (req, res) => {
        try {
            await GameDatabases.advanceActives(); // TODO
            res.send(200).send("OK");
        } catch (e) {
            res.status(500).send(e);
        }
    });

    router.post('/next', isAuthenticated, async (req, res) => {
        try {
            let json = req.body;
            let nextSubmissionID = json.next;
            if (!nextSubmissionID)
                throw "Body missing 'next'";

            let nextSub = await GameDatabases.getSubmissionBySubmissionID(nextSubmissionID);
            if (!nextSub)
                throw "Submission does not exist";

        } catch (e) {
            res.status(500).send(e);
        }
    });

    router.post('/allowsubmissions', isAuthenticated, async (req, res) => {
        try {
            let json = req.body;
            let allow = json.allow;
            GameDatabases.submissionsAllowed(allow);
            res.send(200).send("OK");
        } catch (e) {
            res.status(500).send(e);
        }
    });

    return router;

    //=======================================================
    //==    Internal
    //=======================================================
    async function isAuthenticated(req, res, next) {
        let password = Config.api_key;
        let json = req.body;
        if (json.apikey === password) {
            next();
        } else {
            res.status(401).send("Unauthorized");
        }
    }
};