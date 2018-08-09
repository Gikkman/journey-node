var express = require('express');
const State = global._state;

module.exports = function (MySQL, TokenDatabase, GameDatabases) {
    var router = express.Router();

    router.get('/message', isAuthenticated, async (req, res) => {
        let sql = 'SELECT title, message FROM user_site_message WHERE user_id = ?';
        let user = req.user;

        try{
            let row = await MySQL.queryAsync(
                sql, [user.user_id]);

            if(row && row[0]) {
                console.log('--- Get Message processed.'
                    + ' Outcome: content. '
                    + 'User: ' + user.display_name);
                let title = row[0].title;
                let message = row[0].message;
                successResponse(res, title, message);
            } else {
                res.send();
            }
        } catch (e) {
            console.log('--- Get Message processed.'
                + ' Error: ' + e.message
                + ' User: ' + user.display_name);
            errorResponse(res, e, "Unexpected error when fetching message");
        }
    });

    router.delete('/message', isAuthenticated, async (req, res) => {
        let sql = 'DELETE FROM user_site_message WHERE user_id = ?';
        let user = req.user;
        try {
            await MySQL.queryAsync(sql, [user.user_id]);
            res.sendStatus(200);
        } catch (e) {
            console.log('--- Delete Message.'
                + ' Error: ' + e.message
                + ' User: ' + user.display_name);
            errorResponse(res, e, "Unexpected error when deleting message");
        }
    });

    router.post('/', isAuthenticated, async (req, res) => {
        let json = req.body;

        let user = req.user;
        let method = json.method;
        let payload = json.payload;
        let token = json.token;
        try {

            // Submissions might be closed due to doing a raffle
            let submissionsAllowed = await GameDatabases.submissionsAllowed();
            if (!submissionsAllowed) {
                console.log('--- Method ' + method + ' blocked.'
                + ' Submissions closed.'
                + ' User: ' + user.display_name);
                errorResponse(res,
                    'Submissions closed',
                    'A raffle is currently in progress. No submissions allowed' +
                    ' until it is completed.');
                return;
            }

            // Validate submission token
            let tokenData = await TokenDatabase.validateToken(token, user.user_id);
            if (!tokenData.valid) {
                console.log('--- Method ' + method + ' blocked. '
                + tokenData.log
                + ' User: ' + user.display_name);
                errorResponse(res,
                    "Invalid session",
                    tokenData.reason);
                return;
            }

            // Execute appropriate method
            var outcome = "";
            let Transaction = await MySQL.transaction();
            if (method === 'abandon') {
                outcome = await doAbandon(res, user, payload, GameDatabases, Transaction);
            } else if (method === 'confirm') {
                outcome = await doConfirm(res, user, payload, GameDatabases, Transaction);
            } else if (method === 'submit') {
                outcome = await doSubmit(res, user, payload, GameDatabases, Transaction);
            } else if (method === 'resubmit') {
                outcome = await doResubmit(res, user, payload, GameDatabases, Transaction);
            } else {
                throw new Error("Unsupported method " + method);
            }

            console.log('--- Method ' + method + ' processed.'
                + ' Outcome: ' + outcome
                + ' User: ' + user.display_name);

            if (outcome instanceof Error){
                await Transaction.rollbackAsync();
                throw outcome;
            } else {
                await Transaction.commitAsync();
            }
        } catch (e) {
            console.log('--- Method ' + method + ' processed.'
                + ' Error: ' + e.message
                + ' User: ' + user.display_name);
            errorResponse(res, e, "Unexpected error when making a submission");
        }
    });
    return router;
};

// You may only delete a submission IF the game is not active.
//
// If you delete a submission, the associated quest will only be deleted if it
// has never been played yet. Have it been played at least one time, it becomes
// abandoned instead
async function doAbandon(res, user, payload, GameDatabases, Trans) {
    try {
        let submission = await GameDatabases.getSubmissionByUserID(Trans, user.user_id);

        // Sanity check that we have a submmission
        if(!submission){
            errorResponse(res,
                "Abandon failed",
                "Could not find a submission to abandon. " +
                "Please contact me."
            );
            return "fail - no submission found";
        }

        // Active submissions cannot be deleted
        if (submission.state === State.S.active ) {
            errorResponse(res,
                'Submission deletion failed',
                'Your submission has not been deleted. This probably occures due to the submission winning'
                + ' a raffle recently. Please wait until your game has been completed or voted out, until you'
                + ' try to delete ít.');
            return "fail - submission active";
        } else {
            let quest = await GameDatabases.getQuestByID(Trans, submission.quest_id);

            // Quests are not deleted if they've been played at least once
            // We might want to support re-opening un-completed quests in the future
            let outcome;
            if (quest.times_played === 0) {
                GameDatabases.deleteQuestHard(Trans, quest);
                GameDatabases.deleteSubmissionHard(Trans, submission);
                outcome = "success (hard)";
            } else {
                quest.state = State.Q.abandoned;
                GameDatabases.updateQuest(Trans, quest);
                GameDatabases.deleteSubmission(Trans, submission);
                outcome = "success";
            }

            // The quest might've been 'Suspended'. In that case, we gotta clean the 
            // game_active table too
            if(submission.state === State.S.suspended) {
                GameDatabases.removeSuspended(Trans, submission);
            }

            successResponse(res,
                'Submission deleted',
                'Your submission has successfully been deleted. Remember to make a new submission soon.');
            return outcome;
        }
    } catch (e) {
        return e;
    }
}
;

async function doConfirm(res, user, payload, GameDatabases, Trans) {
    try {
        let submission = await GameDatabases.getSubmissionByUserID(Trans, user.user_id);

        // Sanity check that the user has a submission
        if(!submission){
            errorResponse(res,
                "Confirmation failed",
                "Could not find a submission to confirm for. " +
                "Please contact me."
            );
            return "fail - no submission found";
        }

        // Can only confirm a completed submission
        if (submission.state !== State.S.completed) {
            errorResponse(res,
                'Confirmation failed',
                'The quest is not flagged as completed. Thus, you cannot confirm'
                + ' it\'s completion.');
            return "fail - not completed";
        } else {

            // Delete submission, so the user can make a new one
            GameDatabases.deleteSubmission(Trans, submission);
            successResponse(res,
                'Completion confirmed',
                'Your confirmation has been recorded. You can now make a new submission!');
            return "success";
        }
    } catch (e) {
        return e;
    }
}

// You may only make a submission if you do not have a submission already. If
// you already have a submission, the new submission will be rejected
async function doSubmit(res, user, payload, GameDatabases, Trans) {
    try {
        let temp = await GameDatabases.getSubmissionByUserID(Trans, user.user_id);
        if (temp) {
            // If the user has a submission, something's wrong
            errorResponse(res,
                'Submission failed',
                'Already have a submission. Please delete your current submission,'
                + ' before making a new one.');
            return "fail - submission overwrite";
        } else if (payloadOkForSubmission(payload)) {
            let questID = await GameDatabases.createQuest(Trans, payload.title, payload.system, payload.goal);
            GameDatabases.createSubmission(Trans, questID, user.user_id, payload.comments);
            successResponse(res,
                'Submission successful!',
                'Thank you for submitting to The Journey Project. Much appreciated');
            return "success";
        } else {
            errorResponse(res,
                'Submission failed',
                'A valid submission requires a title, a system and a goal');
            return "fail - invalid payload";
        }
    } catch (e) {
        return e;
    }
}
;

// You may only resubmit a submissions that was voted out. If the submission
// is in any other state, reject the resubmission
async function doResubmit(res, user, payload, GameDatabases, Trans) {
    try {
        let submission = await GameDatabases.getSubmissionByUserID(Trans, user.user_id);

        // Sanity check that we have a submission
        if(!submission){
            errorResponse(res,
                "Resubmission failed",
                "Could not find a submission to resubmit. " +
                "Please contact me."
            );
            return "fail - no submission found";
        }

        // You may only resubmit a game that is voted out
        if (submission.state !== State.S.voted_out) {
            errorResponse(res,
                'Resubmission failed',
                'You currently do not have a submission that is resubmittable');
            return "fail - invalid state";
        }

        // Delete the submission
        GameDatabases.deleteSubmission(Trans, submission);

        // Make sure that the user does not have a submission now that we deleted it
        let temp = await GameDatabases.getSubmissionByUserID(Trans, user.user_id);
        if(temp){
            errorResponse(res,
                'Resubmission failed',
                'You somehow already have a submission in. Please contact me.');
            return "fail - submission already exist";
        }

        // Create a new submission
        GameDatabases.createSubmission(Trans, submission.quest_id, user.user_id, submission.comments);

        // Update the quest
        let quest = await GameDatabases.getQuestByID(Trans, submission.quest_id);
        quest.state = State.Q.submitted;
        GameDatabases.updateQuest(Trans, quest);

        successResponse(res,
            'Resubmission successful!',
            'Thank you for resubmitting ' + quest.title + ' [' + quest.system + ']'
            + ' to The Journey Project.\nMuch appreciated');
        return "success";
    } catch (e) {
        return e;
    }
}

//------------------------------------------------------------------------------
//              Helper Methods
//------------------------------------------------------------------------------
function payloadOkForSubmission(payload) {
    return payload.title && payload.system && payload.goal;
}

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        next();
    else
        res.redirect('/auth/twitch/submit');
}

function errorResponse(res, error, message) {
    var title = error ? (error.message ? error.message : error) : "";
    res.status(400).json({
        title: title,
        message: message
    });
}

function successResponse(res, title, message) {
    res.json({
        title: title,
        message: message
    });
}