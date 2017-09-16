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
        var data = await MySQL.queryAsync(sql, [title, system, goal]);
        return data.insertId;
    };
    
    obj.deleteQuestHard = async (quest) => {
        var sql = "DELETE " + QUESTS + " WHERE uid = ?";
        return await MySQL.queryAsync(sql, [quest.quest_id]);
    };
    
    obj.updateQuest = async (quest) => {
        var sql = "UPDATE " + QUESTS + " SET " 
                + " title = ?, system = ?, goal = ?, seconds_played = ?,"
                + " times_played = ?, completed = ?, abandoned = ?" 
                + " WHERE uid = ?";
        await MySQL.query(sql, 
            [quest.title, quest.system, quest.goal, quest.seconds_played, 
             quest.times_played, quest.completed, quest.abandoned, quest.quest_id]);
    };
    
    obj.getQuestByID = async (questID) => {
        var sql = "SELECT q.uid AS quest_id, q.created, q.title, q.system,"
                + " q.goal, q.seconds_played, q.times_played, q.completed,"
                + " q.abandoned,"
                + " IF(s.uid IS NOT NULL, true, false) AS submitted"
                + " FROM " + QUESTS + " AS q"
                    + " LEFT JOIN (SELECT uid, quest_id FROM " + SUBMISSONS
                    + " WHERE quest_id = ? AND deleted IS NULL) AS s"
                + " ON s.quest_id = q.uid WHERE q.uid = ?";
        let rows = await MySQL.queryAsync(sql, [questID, questID]);
        return rows[0];
    }
    
    //-----------------------------------------------------------
    //              SUBMISSIONS
    //-----------------------------------------------------------
    
    obj.createSubmission = async (questID, userID, comments) => {
        var sql = "INSERT INTO " + SUBMISSONS 
                + " (quest_id, user_id, comments, created)"
                + " VALUES (?,?,?,NOW())";
        let data = await MySQL.queryAsync(sql, [questID, userID, comments]);
        return data.insertId;
    };
    
    obj.deleteSubmission = async (submission) => {
        var sql = "UPDATE " + SUBMISSONS + " SET deleted = NOW() WHERE uid = ?";
        return await MySQL.queryAsync(sql, [submission.submission_id]);
    };
    
    obj.deleteSubmissionHard = async (submission) => {
        var sql = "DELETE FROM " + SUBMISSONS + " WHERE uid = ?";
        return await MySQL.queryAsync(sql, [submission.submission_id]);
    };
    
    obj.getSubmissionByUserID = async (userID) => {
        var sql = "SELECT s.uid AS submission_id, s.quest_id, s.user_id," 
                + " s.created, s.comments, s.voted_out,"
                + " IF(a.uid IS NOT NULL, true, false) AS active"
                + " IF(a.sp IS NOT NULL, a.sp, 0) AS seconds_played"
                + " FROM " + SUBMISSONS + " AS s"
                + " LEFT JOIN"
                    + " (SELECT uid, submission_id, seconds_played AS sp FROM " + ACTIVE + ") AS a"
                + " ON a.submission_id = s.uid"
                + " WHERE s.user_id = ? AND s.deleted IS NULL";
        let rows = await MySQL.queryAsync(sql, [userID]);
        
        if (rows.lenght > 1)
            throw new Error("Illigal submission state. Too many submission: " + rows.lenght);
        else
            return rows[0];
    };
       
    return obj;
};