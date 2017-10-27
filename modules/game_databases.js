const QUESTS = "`game_quest`";
const SUBMISSONS = "`game_submission`";
const ACTIVE = "`game_active`";

const State = global._state;
const JOURNEY = "'journey'";

module.exports = function (MySQL) {
    var obj = {};

    //-----------------------------------------------------------
    //              QUESTS
    //-----------------------------------------------------------

    obj.createQuest = async (title, system, goal) => {
        var sql = "INSERT INTO " + QUESTS
            + " (title, system, goal, created, updated, state)"
            + " VALUES (?,?,?,NOW(), NOW(), ?)";
        var data = await MySQL.queryAsync(sql, [title, system, goal, State.Q.submitted]);
        return data.insertId;
    };

    obj.deleteQuestHard = async (quest) => {
        var sql = "DELETE FROM " + QUESTS + " WHERE uid = ?";
        return await MySQL.queryAsync(sql, [quest.quest_id]);
    };

    const questModifiableFields = ['title', 'system', 'goal','state',
                                   'seconds_played', 'times_played' ];
    obj.updateQuest = async (quest) => {
        if(!quest.quest_id){
            return 'Missing quest ID';
        }

        let sqlStart = "UPDATE " + QUESTS + " SET ";
        let sqlArgs = "updated = NOW()";
        var args = [];
        for(let key in quest) {
            if(questModifiableFields.indexOf(key) === -1) continue;
            sqlArgs += ", " +  key + " = ?";
            args.push(quest[key]);
        }
        let sql = sqlStart + sqlArgs + " WHERE uid=?";
        args.push(quest.quest_id);

        let row = await MySQL.queryAsync(sql, args);
        return row.changedRows;
    };

    obj.getQuestByID = async (questID) => {
        var sql = "SELECT uid AS quest_id, created, updated, title, "
            + " system, goal, state, seconds_played, times_played "
            + " FROM " + QUESTS + " WHERE uid = ?";
        let rows = await MySQL.queryAsync(sql, [questID]);
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
            + " (quest_id, user_id, comments, created, updated, state)"
            + " VALUES (?,?,?, NOW(), NOW(), ?)";
        let data = await MySQL.queryAsync(sql, [questID, userID, comments, State.S.submitted]);
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

    const updateModifiableFields = ['comments', 'state', 'start_date', 'end_date', 'seconds_played'];
    obj.updateSubmission = async (submission) => {
        if(!submission.submission_id){
            return 'Missing submission ID';
        }

        let sqlStart = "UPDATE " + SUBMISSONS + " SET ";
        let sqlArgs = "updated = NOW()";
        var args = [];
        for(let key in submission) {
            if(updateModifiableFields.indexOf(key) === -1) continue;

            sqlArgs += ", " + key + " = ?";
            args.push(submission[key]);
        }
        let sql = sqlStart + sqlArgs + " WHERE uid = ?";
        args.push(submission.submission_id);

        let row = await MySQL.queryAsync(sql, args);
        return row.changedRows;
    };

    obj.getSubmissionByUserID = async (userID) => {
        var sql = "SELECT s.uid AS submission_id, s.quest_id, s.user_id,"
            + " s.created, s.updated, s.comments, s.state,"
            + " s.start_date, s.seconds_played,"
            + " IF(a.state IS NOT NULL, a.state, NULL) AS active_state"
            + " FROM " + SUBMISSONS + " AS s"
            + " LEFT JOIN"
                + " (SELECT submission_id, state FROM " + ACTIVE
                + " WHERE system = " + JOURNEY + ") AS a"
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
            + " s.created,  s.comments, s.state,"
            + " s.start_date, s.seconds_played,"
            + " IF(a.state IS NOT NULL, a.state, NULL) AS active_state"
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
    obj.advanceActives = async (outcome) => {
        var sqlDelete = "DELETE FROM " + ACTIVE
            + " WHERE system = " + JOURNEY + " AND state = ?";
        var sqlUpdate = "UPDATE " + ACTIVE + " SET "
            + " state = ? WHERE system = " + JOURNEY;
        let deleteRow = await MySQL.queryAsync(sqlDelete, [State.A.current]);
        let updateRow = await MySQL.queryAsync(sqlUpdate, [State.A.current]);
        return { deleted: deleteRow.affectedRows, updated: updateRow.affectedRows};
    };

    obj.setNextActive = async (submission) => {
        var sql = "INSERT IGNORE INTO " + ACTIVE + " (submission_id, system, state) "
            + " VALUES (?," + JOURNEY + ",?)";
        let row = await MySQL.queryAsync(sql, [submission.submission_id, State.A.next]);
        return row.affectedRows;
    };

    obj.getNextActive = async () => {
        var sql = "SELECT a.uid, a.submission_id, a.system, a.state,"
                + " s.quest_id, s.seconds_played "
                + " FROM " + ACTIVE + " AS a"
                    + " LEFT JOIN game_submission AS s"
                    + " ON s.uid = a.submission_id"
                + " WHERE a.system = " + JOURNEY + " AND a.state = ?";
        let rows = MySQL.queryAsync(sql, [State.A.next]);
        return rows[0];
    };

    obj.getCurrentActive = async () => {
        var sql = "SELECT a.uid, a.submission_id, a.system, a.state,"
                + " s.quest_id, s.seconds_played "
                + " FROM " + ACTIVE + " AS a"
                    + " LEFT JOIN game_submission AS s"
                    + " ON s.uid = a.submission_id"
                + " WHERE a.system = " + JOURNEY + " AND a.state = ?";
        let rows = await MySQL.queryAsync(sql, [State.A.current]);
        return rows[0];
    };

    return obj;
};