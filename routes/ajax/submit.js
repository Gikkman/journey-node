var express = require('express');

module.exports = function(TokenDatabase, GameDatabases){
	var router = express.Router();

	router.post('/', isAuthenticated, async (req, res) => {
		try{ 
            let json = req.body;
            
            let user = req.user;
            let method = json.method;
            let payload = json.payload;
            let token = json.token;
            
            // Validate submission token
            let tokenData = await TokenDatabase.validateToken(token, user.user_id);
            if( !tokenData.valid ){
                errorResponse(res, "Invalid session", "Submission session timed out");
                return;
            }            
            
            // Execute appropriate method
            var outcome = "";
            if( method === 'delete'){
                outcome = doDelete(res, user, payload, GameDatabases); 
            } 
            else if( method === 'submit' ) {
                outcome = doSubmit(res, user, payload, GameDatabases);
            } 
            else if( method === 'resubmit' ) {
                outcome = doResubmit(res, user, payload, GameDatabases);
            }
            else {
                throw new Error("Unsupported method " + method);
            }
            
            console.log('--- Method ' + method + '  processed.'
                      + ' Outcome: ' + outcome
                      + ' User: ' + user.display_name);
        } catch (e) {
            errorResponse(res, e, "Unexpected error when making a submission");
        }           
	});     
	return router;
};

// You may only delete a submission IF the game is not labeled as 
// NEXT GAME or CURRENT GAME.
// If you delete a submission, the associated quest will only be deleted if it
// has never been played yet. Have it been played at least one time, it becomes
// abandoned instead
async function doDelete(res, user, payload, GameDatabases){
    let submission = GameDatabases.getSubmissionByUserID(user.user_id);
    
    if( submission.active ){
        // Submission cannot be deleted
        //Send response
        errorResponse(res,
            'Submission deletion failed',
            'Your submission has not been deleted. This probably occures due to the submission winning'
           +' a raffle recently. Please wait until your game has been completed or voted out, until you'
           +' try to delete ít.');
        return "fail - submission active";
    } 
    else {
        let quest = GameDatabases.getQuestByID(submission.quest_id);
        
        // Delete submission
        GameDatabases.deleteSubmission(submission);
        
        // Quests are not deleted if they've been played at least once
        // We might want to support re-opening un-completed quests in the future
        if( quest.times_played === 0 ){
            GameDatabases.deleteQuest(quest);
        } 
        else {
            quest.abandoned = true;
            GameDatabases.updateQuest(quest);
        }
        
        successResponse(res, 
            'Submission deleted', 
            'Your submission has successfully been deleted. Remember to make a new submission soon.');
        return "success";
    }
};

// You may only make a submission if you do not have a submission already. If 
// you already have a submission, the new submission will be rejected
function doSubmit(res, user, payload, GameDatabases){
    let temp = GameDatabases.getSubmissionByUserID(user.user_id);
    
    if( temp !== null ){
        // If the user has a submission, something's wrong
        errorResponse(res,
            'Submission failed',
            'Already have a submission. Please delete your current submission,'
           +' before making a new one.');
        return "fail - submission overwrite";
    }
    else if(payloadOkForSubmission(payload)){
        let questID = GameDatabases.createQuest(payload.title, payload.system, payload.goal);
        let submissionID = GameDatabases.createSubmission(questID, user.user_id, payload.comments);
        successResponse(res, 
            'Submission successful!', 
            'Thank you for submitting to The Journey Project.\nMuch appreciated');
        return "success";
    }
    else {
        errorResponse(res,
            'Submission failed',
            'A valid submission requires a title, a system and a goal');
        return "fail - invalid payload";
    }
};

// You may only resubmit a submissions that was voted out. If the submission
// is in any other state, reject the resubmission
function doResubmit(res, user, payload, GameDatabases){
    let submission = GameDatabases.getSubmissionByUserID(user.user_id);
    if( submission.voted_out ){
        GameDatabases.deleteSubmission(submission);
        GameDatabases.createSubmission(submission.quest_id, user.user_id, submission.comments);
        successResponse(res, 
            'Resubmission successful!', 
            'Thank you for resubmitting ' + submission.title + ' [' + submission.system + ']'
          + ' to The Journey Project.\nMuch appreciated');
        return "success";
    }
    else {
        errorResponse(res,
            'Resubmission failed',
            'You currently do not have a submission that is resubmittable');
        return "fail - submission state";
    }
}

function payloadOkForSubmission(payload) {
    return payload.title && payload.system && payload.goal;
}

function isAuthenticated(req, res, next){
    if(req.isAuthenticated())
        next();
    else
        res.redirect('/auth/twitch/submit');
}

function errorResponse(res, error, message){
	var title = error ? error.message : "";  
	res.render('message', 
            {   title: title, 
                status: 1001,
                message:message }
    );
}

function successResponse(res, title, message){
    res.render( 'message', 
        {   title: title, 
            message: message
        } 
    );
}