var express = require('express');
const State = global._state;

module.exports = function (Config, GameDatabases) {
    var router = express.Router();

    router.post('/progress', isAuthenticated, async (req, res) => {
        try {
            let json = req.body;
            let outcome = json.outcome;
            if(outcome !== State.completed && outcome !== State.voted_out){
                throw "Invalid 'outcome' parameter";
            }

            let submission = await GameDatabases.getCurrentActive();
            if(submission){
                submission.state = outcome;
                GameDatabases.updateSubmission(submission);

                let quest = await GameDatabases.getQuestByID(submission.quest_id);
                quest.state = outcome;
                quest.seconds_played += submission.seconds_played;
                quest.times_played++;
                GameDatabases.updateQuest(quest);
            }

            await GameDatabases.advanceActives();

            res.status(200).send("OK. Journey has progressed");
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

            if(submission.state === State.active)
                throw "Submission " + nextSubmissionID + " is already active";

            let affected = await GameDatabases.setNextActive(submission);
            if (affected === 0)
                throw "The 'next' game for Journey is already assigned";

            submission.state = State.active;
            GameDatabases.updateSubmission(submission);

            let quest = {
                quest_id: submission.quest_id,
                state: State.active
            };
            GameDatabases.updateQuest(quest);

            res.status(200).send("OK. Next game set");

        } catch (e) {
            res.status(500).send(e);
        }
    });

    router.post('/allowsubmissions', isAuthenticated, async (req, res) => {
        try {
            let json = req.body;
            let allow = !!json.allow;
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

            let subCount = 0;
            let questCount = 0;

            if(submission)
                subCount = await GameDatabases.updateSubmission(submission);
            if(quest)
                questCount = await GameDatabases.updateQuest(quest);

            res.status(200).send("OK. Submission updated: " + !!subCount
                               + " | Quest updated: " + !!questCount);
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