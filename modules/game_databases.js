module.exports = function (MySQL) {
    const QUESTS = "`game_quest`";
    const SUBMISSONS = "`game_submission`";
    const ACTIVE = "`game_active`";
    var obj = {};

    const JOURNEY = "'journey'";
    const CURRENT = "'current'";
    const NEXT = "'next'";

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
        var sql = "DELETE FROM " + QUESTS + " WHERE uid = ?";
        return await MySQL.queryAsync(sql, [quest.quest_id]);
    };

    const questModifiableFields = ['title', 'system', 'goal', 'seconds_played',
                                   'times_played', 'completed', 'abandoned'];
    obj.updateQuest = async (quest) => {
        if(!quest.quest_id){
            return 'Missing quest ID';
        }

        let sqlStart = "UPDATE " + QUESTS + " SET ";
        let sqlArgs = "";
        var args = [];
        for(let key in quest) {
            if(questModifiableFields.indexOf(key) === -1) continue;
            if(sqlArgs) sqlArgs += ",";

            sqlArgs += key + " = ?";
            args.push(quest[key]);
        }
        let sql = sqlStart + sqlArgs + " WHERE uid = ?";
        args.push(quest.quest_id);

        let row = await MySQL.queryAsync(sql, args);
        return row.changedRows;
    };

    obj.getQuestByID = async (questID) => {
        var sql = "SELECT q.uid AS quest_id, q.created, q.title, q.system,"
            + " q.goal, q.seconds_played, q.times_played, q.completed,"
            + " q.abandoned,"
            + " IF(s.uid IS NOT NULL, true, false) AS submitted"
            + " FROM " + QUESTS + " AS q"
            + " LEFT JOIN"
                + " (SELECT uid, quest_id FROM " + SUBMISSONS
                + " WHERE quest_id = ? AND deleted IS NULL) AS s"
                + " ON s.quest_id = q.uid WHERE q.uid = ?";
        let rows = await MySQL.queryAsync(sql, [questID, questID]);
        return rows[0];
    };

    //-----------------------------------------------------------
    //              SUBMISSIONS
    //-----------------------------------------------------------

    var submissionsAllowed = true;
    obj.submissionsAllowed = (allow) => {
        if (typeof allow !== 'undefined')
            submissionsAllowed = !!allow;
        return submissionsAllowed;
    };

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

    const updateModifiableFields = ['deleted', 'comments', 'completed',
                                    'voted_out', 'start_date', 'seconds_played'];
    obj.updateSubmission = async (submission) => {
        if(!submission.submission_id){
            return 'Missing submission ID';
        }

        let sqlStart = "UPDATE " + SUBMISSONS + " SET ";
        let sqlArgs = "";
        var args = [];
        for(let key in submission) {
            if(updateModifiableFields.indexOf(key) === -1) continue;
            if(sqlArgs)sqlArgs += ",";

            sqlArgs += key + " = ?";
            args.push(submission[key]);
        }
        let sql = sqlStart + sqlArgs + " WHERE uid = ?";
        args.push(submission.submission_id);

        let row = await MySQL.queryAsync(sql, args);
        return row.changedRows;
    };

    obj.getSubmissionByUserID = async (userID) => {
        var sql = "SELECT s.uid AS submission_id, s.quest_id, s.user_id,"
            + " s.created, s.comments, s.completed, s.voted_out,"
            + " s.start_date, s.seconds_played,"
            + " IF(a.state IS NOT NULL, a.state, NULL) AS state,"
            + " IF(a.state IS NOT NULL, true, false) AS active"
            + " FROM " + SUBMISSONS + " AS s"
            + " LEFT JOIN"
                + " (SELECT submission_id, state FROM " + ACTIVE
                + " WHERE system = " + JOURNEY + " ) AS a"
                + " ON a.submission_id = s.uid"
            + " WHERE s.user_id = ? AND s.deleted IS NULL";
        let rows = await MySQL.queryAsync(sql, [userID]);

        if (rows.lenght > 1)
            throw new Error("Illigal submission state. Too many submission: " + rows.lenght);
        else
            return rows[0];
    };

    obj.getSubmissionBySubmissionID = async (submissionID) => {
        var sql = "SELECT s.uid AS submission_id, s.quest_id, s.user_id,"
            + " s.created, s.comments, s.completed, s.voted_out,"
            + " s.start_date, s.seconds_played,"
            + " IF(a.state IS NOT NULL, a.state, NULL) AS state,"
            + " IF(a.state IS NOT NULL, true, false) AS active"
            + " FROM " + SUBMISSONS + " AS s"
            + " LEFT JOIN"
                + " (SELECT submission_id, state FROM " + ACTIVE
                + " WHERE system = " + JOURNEY + ") AS a"
                + " ON a.submission_id = s.uid"
            + " WHERE s.uid = ? AND s.deleted IS NULL";
        let rows = await MySQL.queryAsync(sql, [submissionID]);

        if (rows.lenght > 1)
            throw new Error("Illigal submission state. Too many submission: " + rows.lenght);
        else
            return rows[0];
    };

    //-----------------------------------------------------------
    //              ACTIVE
    //-----------------------------------------------------------
    obj.advanceActives = async () => {
        var sqlDelete = "DELETE FROM " + ACTIVE
            + " WHERE system = " + JOURNEY + " AND state = " + CURRENT;
        var sqlUpdate = "UPDATE " + ACTIVE + " SET "
            + " state = " + CURRENT + " WHERE system = " + JOURNEY;
        let deleteRow = await MySQL.queryAsync(sqlDelete);
        let updateRow = await MySQL.queryAsync(sqlUpdate);
        return { deleted: deleteRow.affectedRows, updated: updateRow.affectedRows};
    };

    obj.setNextActive = async (submission) => {
        var sql = "INSERT IGNORE INTO " + ACTIVE + " (submission_id, system, state) "
            + " VALUES (?," + JOURNEY + "," + NEXT + ")";
        let row = await MySQL.queryAsync(sql, [submission.submission_id]);
        return row.affectedRows;
    };

    obj.getCurrentNextActive = async () => {
        var sql = "SELECT uid, submission_id, system, state FROM " + ACTIVE
                + " WHERE system = " + JOURNEY + " AND state = " + NEXT;
        let rows = MySQL.queryAsync(sql);
        return rows[0];
    };

    return obj;
};