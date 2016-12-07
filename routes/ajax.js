var express = require('express');
module.exports = function(TokenDatabase, SubmissionDatabase){
	var router = express.Router();

	router.post('/submit', (req, res) => {
		try{
			var submission = req.body.i1;
			var token = req.body.token;
			if( !SubmissionDatabase.validateSubmission(submission) ){
				errorResponse(res, err, "Invalid submission");
				return;
			}

			TokenDatabase.validateToken(token,
				(error) => {
					errorResponse(res, error, "Token query failed");
				},
				(token_data) => {
					if( !token_data.valid ){
						errorResponse(res, null, "Invalid token");
						return;
					} 
						
					submission.submitterID = token_data.submitterID;
					var subString  = JSON.stringify(sub1);

					console.log('Token: ' + token);
					console.log('Sub1 should replace: ' + token_data.index);
					console.log('Sub1: ' + subString);

					res.send('SUCC');
					return;

					SubmissionDatabase.removeSubmission(token_data.submitterID,
						(_error) => {
							errorResponse(res, _error, "Deleting submission query failed");
						}, 
						(_success) => {
							SubmissionDatabase.makeSubmission(submission, 
								(__error) => {
									errorResponse(res, __error, "Inserting submission query failed");
								}, 
								(__success) => {
									res.send({status: 1000, message: "Submission successful"});
								}
							);
						}
					);	
				}
			);		
		} catch(err) {
			errorResponse(res, err, "Unexpected submission error")
		}
	});

	return router;
}

function errorResponse(res, error, message){
	var errMess = error ? ": " + error.message : "";
	res.send({status: 1001, message: message + errMess});
}