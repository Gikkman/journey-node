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
						
					submission.user_id 	    = token_data.user_id;
					submission.display_name = token_data.display_name;

					console.log('Sub: ' + JSON.stringify(submission));

					SubmissionDatabase.deleteSubmission(token_data.user_id,
						(_error) => {
							errorResponse(res, _error, "DELETE submission query failed");
						}, 
						(_success) => {
							SubmissionDatabase.makeSubmission(submission, 
								(__error) => {
									errorResponse(res, __error, "INSERT submission query failed");
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