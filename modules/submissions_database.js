module.exports = function(MySQL){
	var obj = {};
	
	obj.validateSubmission = (submission) => {
		return submission.title && submission.system;
	};

	obj.deleteSubmission = async (user_id) => {
		await MySQL.queryAsync(
                "DELETE FROM gamesubmissions WHERE user_id=?", 
                [user_id] );
	};

	obj.makeSubmission = async (submission, user_id, display_name) => {
        var query = "INSERT INTO gamesubmissions " + 
                    "(title, system, goal, comments, user_id, display_name, submission_date) " +
                    "VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)";
        var params = [submission.title, submission.system, submission.goal, 
                      submission.comments, user_id, display_name];
		return await MySQL.queryAsync(query, params);
	};
	
	return obj;
};