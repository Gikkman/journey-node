var express = require('express');
module.exports = function(TokenDatabase, SubmissionDatabase){
	var router = express.Router();

    router.get('/test', isAuthenticated, (req, res) => {
       res.send("Response GET");
    });
    
    router.post('/test', isAuthenticated, (req, res) => {
       res.send("Response POST");
    });

	router.post('/submit', isAuthenticated, async (req, res) => {
		try{ 
            var submission = req.body.i1;
            var token = req.body.token;
            var user = req.user;

            if( !SubmissionDatabase.validateSubmission(submission) ){
                errorResponse(res, "Invalid quest", "Quests must a title and a system");
                return;
            }

            var tokenData = await TokenDatabase.validateToken(token, user.user_id);
            if( !tokenData.valid ){
                errorResponse(res, "Invalid session", "Submission session timed out");
                return;
            }

            await SubmissionDatabase.deleteSubmission(user.user_id);
            await SubmissionDatabase.makeSubmission(submission, user.user_id, user.display_name);
            res.render( 'message', 
                    {   title: 'Submission successful', 
                        message: "Thank you for submitting a quest to The Journey Project.\nMuch appreciated"
                    } 
            );
        } catch (e) {
            errorResponse(res, e, "Unexpected error when inserting a submission");
        }           
	});

	return router;
};

function isAuthenticated(req, res, next){
    if(req.isAuthenticated())
        next();
    else
        res.status(403).send('Not logged in');
}

function errorResponse(res, error, message){
	var title = error ? error.message : "";
    
	res.render('message', 
            {   title: title, 
                status: 1001,
                message:message}
    );
}