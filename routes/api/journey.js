var express = require('express');
const State = global._state;

module.exports = function (Config, GameDatabases) {
    var router = express.Router();

    router.post('/progress', isAuthenticated, async (req, res) => {
        try {
            let json = req.body;
            let outcome = json.outcome;
            let resubmit = json.resubmit;
            if(outcome !== State.S.completed && outcome !== State.S.voted_out){
                throw "Invalid 'outcome' parameter";
            }

            // Update the submission stats
            let submission = await GameDatabases.getCurrentActive();
            if(!submission){
                throw "No submission received when querying for current active";
            }
            submission.state = outcome;
            if(!submission.start_date) submission.start_date = 'NOW()';
            submission.end_date = 'NOW()';
            await GameDatabases.updateSubmission(submission);
            await GameDatabases.deleteSubmission(submission);

            // Begin updating the quest
            let quest = await GameDatabases.getQuestByID(submission.quest_id);
            quest.state = outcome;
            quest.seconds_played += submission.seconds_played;
            quest.times_played++;

            // Before we are done with the quest, will we resubmit it?
            if(resubmit && outcome !== State.S.completed){
                quest.state = State.Q.submitted;
                await GameDatabases.createSubmission(submission.quest_id,
                                                     submission.user_id,
                                                     submission.comments);
            }

            // Update quest
            await GameDatabases.updateQuest(quest);

            // Move the next submission into the current slot
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

            if(submission.state === State.S.active)
                throw "Submission " + nextSubmissionID + " is already active";

            let affected = await GameDatabases.setNextActive(submission);
            if (affected === 0)
                throw "The 'next' game for Journey is already assigned";

            submission.state = State.S.active;
            await GameDatabases.updateSubmission(submission);

            let quest = {
                quest_id: submission.quest_id,
                state: State.Q.active
            };
            await GameDatabases.updateQuest(quest);

            res.status(200).send("OK. Next game set");

        } catch (e) {
            res.status(500).send(e);
        }
    });

    router.post('/allowsubmissions', isAuthenticated, async (req, res) => {
        try {
            let json = req.body;
            let allow = !!json.allow;
            let status = await GameDatabases.submissionsAllowed(allow);
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
                questCount = await GameDatabases.updateQuest(quest, true);

            res.status(200).send("OK. Submission updated: " + !!subCount
                               + " Quest updated: " + !!questCount);
        } catch (e) {
            res.status(500).send(e);
        }
    });

    router.get('/ping', isAuthenticated, async (req, res) => {
       try {
           res.status(200).send("OK");
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