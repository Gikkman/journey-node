var express = require('express');
module.exports = function (Config, GameDatabases) {
    var router = express.Router();

    router.post('/progress', isAuthenticated, async (req, res) => {
        try {
            let result = await GameDatabases.advanceActives();
            res.status(200).send("OK");
        } catch (e) {
            res.status(500).send(e);
        }
    });

    router.post('/setnext', isAuthenticated, async (req, res) => {
        try {
            let json = req.body;
            let nextSubmissionID = json.next;
            if (!nextSubmissionID)
                throw "Body missing 'next'";

            let submission = await GameDatabases.getSubmissionBySubmissionID(nextSubmissionID);
            if (!submission)
                throw "Submission " + nextSubmissionID + " does not exist";

            if(submission.active)
                throw "Submission " + nextSubmissionID + " is already active";

            let affected = await GameDatabases.setNextActive(submission);
            if (affected === 0)
                throw "The 'next' game for Journey is already assigned";

            res.status(200).send("OK");

        } catch (e) {
            res.status(500).send(e);
        }
    });

    router.post('/allowsubmissions', isAuthenticated, async (req, res) => {
        try {
            let json = req.body;
            let allow = json.allow;
            let status = GameDatabases.submissionsAllowed(allow);
            res.status(200).send("OK. Is allowed: " + status);
        } catch (e) {
            res.status(500).send(e);
        }
    });

    router.post('/update', isAuthenticated, async (req, res) => {
        try {
            let json = req.body;
            let submission = json.submission;
            let quest = json.quest;

            if(submission)
                var subCount = await GameDatabases.updateSubmission(submission);
            if(quest)
                var questCount = await GameDatabases.updateQuest(quest);

            res.status(200).send("OK. Submission updated: " + subCount===1
                               + " Quest updated: " + questCount===1);
        } catch (e) {
            res.status(500).send(e);
        }
    });

    return router;

    //=======================================================
    //==    Internal
    //=======================================================
    async function isAuthenticated(req, res, next) {
        if (req.headers.apikey === Config.api_key) {
            next();
        } else {
            res.status(401).send("Unauthorized");
        }
    }
};