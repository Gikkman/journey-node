module.exports = function(MySQL){
	var obj = {};
	
	obj.validateSubmission = function(submission){
		return submission.title && submission.system;
	}

	obj.deleteSubmission = function(submitterID, onError, onSuccess){
		MySQL.query("DELETE FROM gamesubmissions WHERE submitterID=?", 
			[submitterID], 
			(err, rows) => {
				if( err ) 
					onError(err);
				else
					onSuccess(rows);
			}
		);
	}

	obj.makeSubmission = function(submission, onError, onSuccess){
		MySQL.query("INSERT INTO gamesubmissions (title, system, goal, comments, submitterID) VALUES(?,?,?,?,?)",
			[submission.title, submission.system, submission.goal, submission.comments, submission.submitterID],
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