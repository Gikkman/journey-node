var express = require('express');
const State = global._state;
const Config = global._config;

module.exports = function (MySQL, GameDatabases, SiteMessageDB) {
    var router = express.Router();

    //=======================================================
    //==    Progress endpoint
    //=======================================================
    router.post('/progress', isAuthenticated, async (req, res) => {
        let Trans = await MySQL.transaction();
        try {
            // Update the submission stats
            let current = await GameDatabases.getCurrentActive(Trans);
            if(!current){
                throw "No 'current' game found. Cannot progress!";
            }
            let outcome = current.state;
            if(outcome !== State.S.completed && outcome !== State.S.voted_out && outcome !== State.S.suspended) {
                throw "Invalid 'current' state. Cannot progress unless it is 'completed', 'voted out' or 'suspended'";
            }

            // Check that we actually have a Next submission
            let next = await GameDatabases.getNextActive(Trans);
            if(!next) {
                throw "No 'next' game found. Cannot progress!";
            }

            // Move the next submission into the current slot
            await GameDatabases.advanceActives(Trans);

            // Commit transaction and send OK
            await Trans.commitAsync();
            res.status(200).send("OK. Journey has progressed");
        } catch (e) {
            // If error, rollback and send ERROR
            await Trans.rollbackAsync();
            errorLogAndSend(res, e);
        }
    });
    
    //=======================================================
    //==    Ender endpoints
    //=======================================================
    
    router.post('/complete', isAuthenticated, async (req,res) => {
        let Trans = await MySQL.transaction();
        try {
            let json = req.body;

            // Required for every outcome
            let submission_id = json.submission_id;
            if(!submission_id) {
                throw "Missing 'submission_id'";
            }
            let rating = json.rating;
            if(!rating) {
                throw "Missing 'rating'";
            }

            // Fetch submission and quest
            let submission = getAndVerifySubmission(Trans, submission_id);
            let quest = getAndVerifyQuest(Trans, submission);

            // Make relevant updates
            updateSubmissionAndQuest(Trans, submission, State.S.completed, quest, State.Q.completed);

            // Set site message
            let formatter = global.formatter;
            let messageData = {
                rating: rating,
                times_played:  quest.times_played,
                date: formatter.today(),
                time: formatter.toHhmmss(submission.seconds_played),
                total_time: formatter.toHhmmss(quest.seconds_played)
            };
            
            let siteMessage = global._site_message.COMPLETED;
            await SiteMessageDB.setSiteMessage(Trans, submission.user_id, siteMessage, messageData);

            // Commit transaction and send OK
            await Trans.commitAsync();
            res.status(200).send("OK. Submission completed");
        } catch (e) {
            // If error, rollback and send ERROR
            await Trans.rollbackAsync();
            errorLogAndSend(res, e);
        }
    });

    router.post('/voteout', isAuthenticated, async (req,res) => {
        let Trans = await MySQL.transaction();
        try {
            let json = req.body;

            // Required for every outcome
            let submission_id = json.submission_id;
            let rating = json.rating;
            let resubmit = !!json.resubmit;
            let yes_count = json.yes_count;
            let no_count = json.no_count;

            // Validate the input
            if(!submission_id) {
                throw "Missing 'submission_id'";
            }
            if(!rating) {
                throw "Missing 'rating'";
            }
            if(resubmit === null) {
                throw "Missing 'resubmit'";
            }
            if(isNaN(yes_count)) {
                throw "Missing 'yes_count'";
            }
            if(isNaN(no_count)) {
                throw "Missing 'no_count";
            }

            // Fetch submission and quest
            let submission = getAndVerifySubmission(Trans, submission_id);
            let quest = getAndVerifyQuest(Trans, submission);

            // Make relevant updates
            updateSubmissionAndQuest(Trans, submission, State.S.voted_out, quest, State.Q.voted_out);

            // If a submission should be resubmitted, we delete the old
            // submission and create a new one, pointing to the same quest.
            // If a submission should not be resubmitted, we do not delete it
            // since the user will delete it themselves when they click "Confirm"
            if(resubmit){
                await GameDatabases.deleteSubmission(Trans, submission);
                await GameDatabases.createSubmission(Trans,
                    submission.quest_id,
                    submission.user_id,
                    submission.comments);

                    quest.state = State.Q.submitted;
                    await GameDatabases.updateQuest(Trans, quest);
            }

            // Set site message
            let formatter = global.formatter;
            let messageData = {
                rating: rating,
                times_played:  quest.times_played,
                date: formatter.today(),
                yes_count: yes_count,
                no_count: no_count,
                time: formatter.toHhmmss(submission.seconds_played),
                total_time: formatter.toHhmmss(quest.seconds_played)
            };

            let siteMessage = resubmit ?
                global._site_message.VOTED_OUT_RESUBMITTED :
                global._site_message.VOTED_OUT;
            await SiteMessageDB.setSiteMessage(Trans, submission.user_id, siteMessage, messageData);

            // Commit transaction and send OK
            await Trans.commitAsync();
            res.status(200).send("OK. Submission voted out");
        } catch (e) {
            // If error, rollback and send ERROR
            await Trans.rollbackAsync();
            errorLogAndSend(res, e);
        }
    });

    router.post('/suspend', isAuthenticated, async (req, res) => {
        let Trans = await MySQL.transaction();
        try {
            let json = req.body;

            // Required parameter
            let comment = json.comment;
            if(!comment) {
                throw "Missing 'comment'";
            }
            
            let nextSubmissionID = json.next;
            if (!nextSubmissionID)
                throw "Body missing 'next'";

            let submission = getAndVerifySubmission(Trans, nextSubmissionID);
            
            submission.state = State.S.suspended;
            await GameDatabases.updateSubmission(Trans, submission);

            // Update the quest
            let quest = await GameDatabases.getQuestByID(Trans, submission.quest_id);
            quest.state = State.Q.suspended;
            await GameDatabases.updateQuest(Trans, quest);

            // Set the site message
            let formatter = global.formatter;
            let messageData = {
                date: formatter.today(),
                comment: comment
            };
            siteMessage = global._site_message.SUSPENDED;
            await SiteMessageDB.setSiteMessage(Trans, submission.user_id, siteMessage, messageData);

            // Commit transaction and send OK
            await Trans.commitAsync();
            res.status(200).send("OK. Submission suspended");
        } catch (e) {
            // If error, rollback and send ERROR
            await Trans.rollbackAsync();
            errorLogAndSend(res, e);
        }
    });
    
    async function getAndVerifySubmission(Trans, submissionID) {
        let submission = await GameDatabases.getSubmissionBySubmissionID(Trans, submissionID);
        if (!submission)
            throw "Submission " + submissionID + " does not exist";
        if(!submission.active_state) {
            throw "Cannot modify a submission that is not active";
        }
        return submission;
    }
    
    async function getAndVerifyQuest(Trans, submission) {
        let quest = await GameDatabases.getQuestByID(Trans, submission.quest_id);
        if(!quest) {
            throw "No quest received when querying ID " + submission.quest_id;
        }
        return quest;
    }
    
    async function updateSubmissionAndQuest(Trans, submission, submissionState, quest, questState) {
        // Make relevant updates
        submission.state = submissionState;
        submission.start_date = submission.start_date || 'NOW()';
        submission.end_date = 'NOW()';
        await GameDatabases.updateSubmission(Trans, submission);

        quest.state = questState;
        quest.times_played++;
        quest.seconds_played += submission.seconds_played;
        await GameDatabases.updateQuest(Trans, quest);
    }
    
    //=======================================================
    //==    Setter endpoints
    //=======================================================

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
            if(submission.state !== State.S.submitted)
                throw "Submission " + nextSubmissionID + " is in state " + submission.state 
                    + ". Has to be in state " + State.S.submitted;

            let currentNext = await GameDatabases.getNextActive(Trans);
            if(currentNext)
                throw "Submission " + currentNext.submission_id + " is already assigned as 'next'";

            // Queue the submission as NEXT
            let affected = await GameDatabases.setNextActive(Trans, submission);
            if (affected === 0)
                throw "Error inserting submission as 'next'";

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
            errorLogAndSend(res, e);
        }
    });
    
    router.post('/setencounter', isAuthenticated, async (req, res) => {
        let Trans = await MySQL.transaction();
        try {
            let json = req.body;
            let submissionID = json.next;
            if (!submissionID)
                throw "Body missing 'submission_id'";

            // Check that the submission exists as it should
            let submission = await GameDatabases.getSubmissionBySubmissionID(Trans, submissionID);
            if (!submission)
                throw "Submission " + submissionID + " does not exist";

            // Check that the submission is not already active
            if(submission.state !== State.S.suspended)
                throw "Submission " + submissionID + " is not suspended";
            
            // Check that the submission has not been deleted by the user
            if(submission.deleted)
                throw "Submission " + submissionID + " has been deleted";

            // Queue the submission as NEXT
            let affected = await GameDatabases.setEncounterActive(Trans, submission);
            if (affected === 0)
                throw "Error inserting submission as 'next'";

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
            errorLogAndSend(res, e);
        }
    });
    
    //=======================================================
    //==    Misc endpoints
    //=======================================================

    router.post('/allowsubmissions', isAuthenticated, async (req, res) => {
        try {
            let json = req.body;
            let allow = !!json.allow;
            let status = await GameDatabases.submissionsAllowed(allow);
            res.status(200).send("OK. Is allowed: " + status);
        } catch (e) {
            errorLogAndSend(res, e);
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
            errorLogAndSend(res, e);
        }
    });

    router.get('/ping', isAuthenticated, async (req, res) => {
       try {
            res.status(200).send("OK");
       } catch (e) {
            errorLogAndSend(res, e);
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

    function errorLogAndSend(res, error) {
        console.log( error instanceof Error ? error.stack : error);
        res.status(500).send(error instanceof Error ? error.message : error);
    }
};