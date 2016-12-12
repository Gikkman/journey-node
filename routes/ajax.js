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
			console.log("validating token " + new Date());
			TokenDatabase.validateToken(token,
				(error) => {
					errorResponse(res, error, "Token query failed");
				},
				(token_data) => {
					console.log( "token_data  " + JSON.stringify(token_data))
					if( !token_data.valid ){
						errorResponse(res, null, "Invalid token");
						return;
					} 
					console.log("removing token " + new Date());
					TokenDatabase.removeToken(token,
						(remove_error) => {
							console.log("Error removing used token");
							console.log(remove_error.stack)
						}
					);
						
					submission.user_id 	    = token_data.user_id;
					submission.display_name = token_data.display_name;

					console.log("deleting old submission " + new Date());
					SubmissionDatabase.deleteSubmission(token_data.user_id,
						(_error) => {
							errorResponse(res, _error, "DELETE submission query failed");
						}, 
						(_success) => {
							console.log("maing new submission " + new Date());
							SubmissionDatabase.makeSubmission(submission, 
								(__error) => {
									errorResponse(res, __error, "INSERT submission query failed");
								}, 
								(__success) => {
									res.render('message', {title: 'Submission successful', message: "Thank you for submitting a quest to The Journey Project.\nMuch appreciated"})
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
	var title = error ? error.message : "";
	res.render('message', {title: title, status: 1001, message:message});
}