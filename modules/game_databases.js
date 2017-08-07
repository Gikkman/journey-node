module.exports = function(MySQL){
	const QUESTS = "game_quest";
	const SUBMISSONS = "game_submission";
	const ACTIVE = "game_active";
    var obj = {};
	
    //-----------------------------------------------------------
    //              QUESTS
    //-----------------------------------------------------------
    
	obj.createQuest = async (title, system, goal) => {
        var sql = "INSERT INTO " + QUESTS 
                + " (title, system, goal, created)"
                + " VALUES (?,?,?,NOW())";
        return await MySQL.queryAsync(sql, [title, system, goal]).insertId;
    };
    
    obj.deleteQuest = async (quest) => {
        var sql = "DELETE FROM " + QUESTS + " WHERE uid = ?";
        return await MySQL.queryAsync(sql, [quest.quest_id]);
    };
    
    obj.updateQuest = async (quest) => {
        var sql = "UPDATE " + QUESTS + " SET " 
                + " title = ?, system = ?, goal = ?, seconds_played = ?,"
                + " times_played = ?, completed = ?, abandoned = ?" 
                + " WHERE uid = ?";
        return await MySQL.query(sql, 
            [quest.title, quest.system, quest.goal, quest.seconds_played, 
             quest.times_played, quest.completed, quest.abandoned, quest.quest_id]);
    };
    
    obj.getQuestByID = async (questID) => {
        var sql = "SELECT q.uid AS quest_id, q.created, q.title, q.system," 
                + " q.goal, q.seconds_played, q.times_played, q.completed,"+
                + " q.abandoned," 
                + " IF(s.uid != NULL, true, false) AS submitted"
                + " FROM " + QUESTS + " AS s"
                + " LEFT JOIN"
                    + " (SELECT s.uid FORM " + SUBMISSONS 
                    + " WHERE s.deleted = NULL) AS s"
                + " ON s.quest_id = q.uid"
                + " WHERE q.uid = ?";
        return await MySQL.queryAsync(sql, [questID]);
    };
    
    
    //-----------------------------------------------------------
    //              SUBMISSIONS
    //-----------------------------------------------------------
    
    obj.createSubmission = async (questID, userID, comments) => {
        var sql = "INSERT INTO " + SUBMISSONS 
                + " (quest_id, user_id, comments, created)"
                + " VALUES (?,?,?,NOW())";
        return await MySQL.queryAsync(sql, [questID, userID, comments]).insertId;
    };
    
    obj.deleteSubmission = async (submission) => {
        var sql = "UPDATE " + SUBMISSONS + " SET deleted = NOW() WHERE uid = ?";
        return await MySQL.queryAsync(sql, [submission.submission_id]);
    };
    
    obj.getSubmissionByUserID = async (userID) => {
        var sql = "SELECT s.uid AS submission_id, s.quest_id, s.user_id," 
                + " s.created, s.comments, s.voted_out, s.deleted,"
                + " IF(a.uid != null, true, false) AS active"
                + " FROM " + SUBMISSONS + " AS s"
                + " LEFT JOIN"
                    + " (SELECT a.uid FROM " + ACTIVE + ") AS a"
                + " ON a.submission_id = s.uid"
                + " WHERE s.user_id = ?";
        return await MySQL.queryAsync(sql, [userID]);
    };
};