var express = require('express');
const State = global._state;
const Config = global._config;

module.exports = function (MySQL, GameDatabases, SiteMessageDB) {
    var router = express.Router();

    router.post('/progress', isAuthenticated, async (req, res) => {
        let Trans = await MySQL.transaction();
        try {
            let json = req.body;
            let outcome = json.outcome;
            let resubmit = json.resubmit;
            if(outcome !== State.S.completed && outcome !== State.S.voted_out){
                throw "Invalid 'outcome' parameter";
            }

            // Update the submission stats
            let submission = await GameDatabases.getCurrentActive(Trans);
            if(!submission){
                throw "No submission received when querying for current active";
            }
            submission.state = outcome;
            if(!submission.start_date){
                submission.start_date = 'NOW()';
            } 
            submission.end_date = 'NOW()';
            await GameDatabases.updateSubmission(Trans, submission);

            // If a submission should be resubmitted, we delete the old
            // submission and create a new one, pointing to the same quest.
            // If a submission should not be resubmitted, we do not delete it
            // since the user will delete it themselves when they click "Confirm"
            if(resubmit && outcome === State.S.voted_out){
                await GameDatabases.deleteSubmission(Trans, submission);
                await GameDatabases.createSubmission(Trans,
                    submission.quest_id,
                    submission.user_id,
                    submission.comments);
            }

            // Update the quest
            let quest = await GameDatabases.getQuestByID(Trans, submission.quest_id);
            quest.state = outcome;
            quest.seconds_played += submission.seconds_played;
            quest.times_played++;

            // If the submission was auto-resubmitted, we set the quest as submitted too
            if(resubmit && outcome === State.S.voted_out){
                quest.state = State.Q.submitted;
            }

            // Write quest update
            await GameDatabases.updateQuest(Trans, quest);

            // Move the next submission into the current slot
            await GameDatabases.advanceActives(Trans);

            // Set the correct site message for the user who had the submission ended
            // For backwards compability, if no review is supplied, ignore this
            let review = json.review;
            if(review) {
                let formatter = global.formatter;

                let messageData = {};
                messageData.rating = review.rating;
                messageData.times_played = quest.times_played;
                messageData.date = formatter.today();
                messageData.time = formatter.toHhmmss(submission.seconds_played);
                messageData.total_time = formatter.toHhmmss(quest.seconds_played);

                let message;
                if(outcome === State.S.completed) {
                    message = global._site_message.COMPLETED;
                }
                else if (outcome === State.S.voted_out && resubmit) {
                    message = global._site_message.VOTED_OUT_RESUBMIT;
                }
                else if (outcome === State.S.voted_out) {
                    message = global._site_message.VOTED_OUT;
                }
                message = message.format(messageData);
                SiteMessageDB.setSiteMessage(Trans, submission.user_id, message);
            }

            // Commit transaction and send OK
            await Trans.commitAsync();
            res.status(200).send("OK. Journey has progressed");
        } catch (e) {
            // If error, rollback and send ERROR
            await Trans.rollbackAsync();
            res.status(500).send(e);
        }
    });

    router.post('/suspend', isAuthenticated, async (req, res) => {
        let Trans = await MySQL.transaction();
        try {
            let json = req.body;

            // Update the submission stats
            let submission = await GameDatabases.getCurrentActive(Trans);
            if(!submission){
                throw "No submission received when querying for current active";
            }
            submission.state = State.S.suspended;
            await GameDatabases.updateSubmission(Trans, submission);

            // Update the quest
            let quest = await GameDatabases.getQuestByID(Trans, submission.quest_id);
            quest.state = State.Q.suspended;
            await GameDatabases.updateQuest(Trans, quest);

            // Move the next submission into the current slot
            await GameDatabases.advanceActives(Trans);

            // Set the site message for the user
            let comment = json.comment;
            if(!comment) {
                throw "No suspension comment sent. Please supply one under 'comment'";
            }
            let formatter = global.formatter;
            let message = global._site_message.SUSPENDED;
            let messageData = {};
            messageData.date = formatter.today();
            messageData.comment = comment;

            message = message.format(messageData);
            SiteMessageDB.setSiteMessage(Trans, submission.user_id, message);

            // Commit transaction and send OK
            await Trans.commitAsync();
            res.status(200).send("OK. Journey has progressed (current was suspended)");
        } catch (e) {
            // If error, rollback and send ERROR
            await Trans.rollbackAsync();
            res.status(500).send(e);
        }
    })

    router.post('/setnext', isAuthenticated, async (req, res) => {
        let Trans = await MySQL.transaction();
        try {
            let json = req.body;
            let nextSubmissionID = json.next;
            if (!nextSubmissionID)
                throw "Body missing 'next'";

            // Check that the submission exists as it should
            let submission = await GameDatabases.getSubmissionBySubmissionID(Trans, nextSubmissionID);
            if (!submission)
                throw "Submission " + nextSubmissionID + " does not exist";

            // Check that the submission is not already active
            if(submission.state === State.S.active)
                throw "Submission " + nextSubmissionID + " is already active";

            // Queue the submission as NEXT
            let affected = await GameDatabases.setNextActive(Trans, submission);
            if (affected === 0)
                throw "The 'next' game for Journey is already assigned";

            // Update the submission state
            submission.state = State.S.active;
            await GameDatabases.updateSubmission(Trans, submission);

            // Update the quest state
            let quest = {
                quest_id: submission.quest_id,
                state: State.Q.active
            };
            await GameDatabases.updateQuest(Trans, quest);

            // Commit transaction and send OK
            await Trans.commitAsync();
            res.status(200).send("OK. Next game set");

        } catch (e) {
            // If error, rollback and send ERROR
            await Trans.rollbackAsync();
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
        let Trans = await MySQL.transaction();
        try {
            let json = req.body;
            let submission = json.submission;
            let quest = json.quest;

            // Counters for keeping track of how many updates occured
            let subCount = 0;
            let questCount = 0;

            // Perform submission and quest updates
            // This will only affect the fields labeled as "allowed for updated"
            if(submission)
                subCount = await GameDatabases.updateSubmission(Trans, submission);
            if(quest)
                questCount = await GameDatabases.updateQuest(Trans, quest, true);

            // Commit transaction and send OK
            await Trans.commitAsync();
            res.status(200).send("OK. Submission updated: " + !!subCount
                               + " Quest updated: " + !!questCount);
        } catch (e) {
            // If error, rollback and send ERROR
            await Trans.rollbackAsync();
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