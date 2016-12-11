module.exports = function(MySQL){
	var obj = {};
	
	obj.validateSubmission = function(submission){
		return submission.title && submission.system;
	}

	obj.deleteSubmission = function(userID, onError, onSuccess){
		MySQL.query("DELETE FROM gamesubmissions WHERE user_id=?", 
			[userID], 
			(err, rows) => {
				if( err ) 
					onError(err);
				else
					onSuccess(rows);
			}
		);
	}

	obj.makeSubmission = function(submission, onError, onSuccess){
		MySQL.query("INSERT INTO gamesubmissions (title, system, goal, comments, user_id, display_name, submission_date) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)",
			[submission.title, submission.system, submission.goal, submission.comments, submission.user_id, submission.display_name],
			(err, rows) => {
				if( err )
					onError(err);
				else
					onSuccess(rows);
			}
		);
	}
	
	return obj;
} 