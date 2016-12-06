var express = require('express');
module.exports = function(TokenDatabase, SubmissionDatabase){
	var router = express.Router();

	router.post('/submit', (req, res) => {
		try{
			var token = req.body.token;
			TokenDatabase.validateToken(token,
				(error) => {
					//TODO
				},
				(token_data) => {
					if( !token_data.valid ){
						res.send("ERR");
					} else {
						var submission = req.body.i1;
						submission.submitterID = token_data.submitterID;
						var subString  = JSON.stringify(sub1);

						console.log('Token: ' + token);
						console.log('Sub1 should replace: ' + token_data.index);
						console.log('Sub1: ' + subString);

						res.send('SUCC');
						return;

						SubmissionDatabase.removeSubmission(token_data.submitterID,
							(error) => {
								//TODO
							}, 
							(success) => {
								SubmissionDatabase.makeSubmission(submission, 
									(_error) => {
										//TODO
									}, 
									(_success) => {
										res.send("SUCC");
									}
								);
							}
						);	
					} 
				}
			);		
		} catch(err) {
			res.send("ERR");
		}
	});
	return router;
}