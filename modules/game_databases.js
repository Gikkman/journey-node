const QUESTS = "`game_quest`";
const SUBMISSONS = "`game_submission`";
const ACTIVE = "`game_active`";

const State = global._state;
const JOURNEY = "'journey'";
const SPECIAL = "'special'";

module.exports = function () {
    var obj = {};

    //-----------------------------------------------------------
    //              QUESTS
    //-----------------------------------------------------------

    obj.createQuest = async (DB, title, system, goal) => {
        var sql = "INSERT INTO " + QUESTS
            + " (`title`, `system`, `goal`, `created`, `updated`, `state`)"
            + " VALUES (?,?,?,NOW(), NOW(), ?)";
        var data = await DB.queryAsync(sql, [title, system, goal, State.Q.submitted]);
        return data.insertId;
    };

    obj.deleteQuestHard = async (DB, quest) => {
        var sql = "DELETE FROM " + QUESTS + " WHERE `uid` = ?";
        return await DB.queryAsync(sql, [quest.quest_id]);
    };

    const questModifiableFieldsLimited = ['title', 'system', 'goal'];
    const questModifiableFields = ['title', 'system', 'goal','state', 'seconds_played', 'times_played' ];
    obj.updateQuest = async (DB, quest, limited) => {
        if(!quest.quest_id){
            return 'Missing quest ID';
        }
        let allowedFields = limited ? questModifiableFieldsLimited : questModifiableFields;

        let sqlStart = "UPDATE " + QUESTS + " SET ";
        let sqlArgs = "`updated` = NOW()";
        var args = [];
        for(let key in quest) {
            if(allowedFields.indexOf(key) === -1) continue;
            sqlArgs += ", `" +  key + "` = ?";
            args.push(quest[key]);
        }
        let sql = sqlStart + sqlArgs + " WHERE `uid`=?";
        args.push(quest.quest_id);

        let row = await DB.queryAsync(sql, args);
        return row.changedRows;
    };

    obj.getQuestByID = async (DB, questID) => {
        var sql = "SELECT `uid` AS quest_id, `created`, `updated`, `title`, "
            + " `system`, `goal`, `state`, `seconds_played`, `times_played` "
            + " FROM " + QUESTS + " WHERE `uid` = ?";
        let rows = await DB.queryAsync(sql, [questID]);
        return rows[0];
    };

    //-----------------------------------------------------------
    //              SUBMISSIONS
    //-----------------------------------------------------------

    var submissionsAllowed = true;
    obj.submissionsAllowed = async (allow) => {
        if (typeof allow !== 'undefined')
            submissionsAllowed = !!allow;
        return submissionsAllowed;
    };

    obj.createSubmission = async (DB, questID, userID, comments) => {
        var sql = "INSERT INTO " + SUBMISSONS
            + " (`quest_id`, `user_id`, `comments`, `created`, `updated`, `state`)"
            + " VALUES (?,?,?, NOW(), NOW(), ?)";
        let data = await DB.queryAsync(sql, [questID, userID, comments, State.S.submitted]);
        return data.insertId;
    };

    obj.deleteSubmission = async (DB, submission) => {
        var sql = "UPDATE " + SUBMISSONS + " SET `deleted` = NOW() WHERE `uid` = ?";
        return await DB.queryAsync(sql, [submission.submission_id]);
    };

    obj.deleteSubmissionHard = async (DB, submission) => {
        var sql = "DELETE FROM " + SUBMISSONS + " WHERE `uid` = ?";
        return await DB.queryAsync(sql, [submission.submission_id]);
    };

    const updateModifiableFields = ['comments', 'state', 'start_date', 'end_date', 'seconds_played'];
    obj.updateSubmission = async (DB, submission) => {
        if(!submission.submission_id){
            return 'Missing submission ID';
        }

        let sqlStart = "UPDATE " + SUBMISSONS + " SET ";
        let sqlArgs = "`updated` = NOW()";
        var args = [];
        for(let key in submission) {
            if(updateModifiableFields.indexOf(key) === -1) continue;

            sqlArgs += ", `" + key + "` = ?";
            let val = submission[key];
            if(val === 'NOW()'){
                sqlArgs = sqlArgs.slice(0, -1) + val;
            } else {
                args.push(val);
            }
        }
        let sql = sqlStart + sqlArgs + " WHERE `uid` = ?";
        args.push(submission.submission_id);

        let row = await DB.queryAsync(sql, args);
        return row.changedRows;
    };

    obj.getSubmissionByUserID = async (DB, userID) => {
        var sql = "SELECT `s`.`uid` AS `submission_id`, `s`.`quest_id`, `s`.`user_id`,"
            + " `s`.`created`, `s`.`updated`, `s`.`comments`, `s`.`state`,"
            + " `s`.`start_date`, `s`.`seconds_played`,"
            + " IF(`a`.`state` IS NOT NULL, `a`.`state`, NULL) AS `active_state`"
            + " FROM " + SUBMISSONS + " AS `s`"
            + " LEFT JOIN"
                + " (SELECT `submission_id`, `state` FROM " + ACTIVE
                + " WHERE `system` = " + JOURNEY + ") AS `a`"
                + " ON `a`.`submission_id` = `s`.`uid`"
            + " WHERE `s`.`user_id` = ? AND `s`.`deleted` IS NULL";
        let rows = await DB.queryAsync(sql, [userID]);

        if (rows.length > 1)
            throw new Error("Illigal submission state. Too many submission: " + rows.length);
        else
            return rows[0];
    };

    obj.getSubmissionBySubmissionID = async (DB, submissionID) => {
        var sql = "SELECT `s`.`uid` AS `submission_id`, `s`.`quest_id`, `s`.`user_id`,"
            + " `s`.`created`,  `s`.`comments`, `s`.`state`,"
            + " `s`.`start_date`, `s`.`seconds_played`,"
            + " IF(`a`.`state` IS NOT NULL, `a`.`state`, NULL) AS `active_state`"
            + " FROM " + SUBMISSONS + " AS `s`"
            + " LEFT JOIN"
                + " (SELECT `submission_id`, `state` FROM " + ACTIVE
                + " WHERE `system` = " + JOURNEY + ") AS `a`"
                + " ON `a`.`submission_id` = `s`.`uid`"
            + " WHERE `s`.`uid` = ? AND `s`.`deleted` IS NULL";
        let rows = await DB.queryAsync(sql, [submissionID]);

        if (rows.length > 1)
            throw new Error("Illigal submission state. Too many submission: " + rows.length);
        else
            return rows[0];
    };

    //-----------------------------------------------------------
    //              ACTIVE
    //-----------------------------------------------------------
    
    obj.advanceActives = async (DB) => {
        var sqlDelete = "DELETE FROM " + ACTIVE
            + " WHERE `system` = " + JOURNEY + " AND `state` = ?";
        var sqlUpdate = "UPDATE " + ACTIVE + " SET "
            + " `state` = ? WHERE `system` = " + JOURNEY + " AND `state` = ?";
        let deleteRow = await DB.queryAsync(sqlDelete, [State.A.current]);
        let updateRow = await DB.queryAsync(sqlUpdate, [State.A.current, State.A.next]);
        return { deleted: deleteRow.affectedRows, updated: updateRow.affectedRows};
    };

    obj.setNextActive = async (DB, submission) => {
        // Calculate index of the next game, by incrementing the current game's index 
        var indexSQL = "SELECT `index` + 1 as idx FROM " + ACTIVE 
                + " WHERE `system` = " + JOURNEY + " AND `state` = ?";
        let res = await DB.queryAsync(indexSQL, [State.A.current]);
        if(!res || !res[0])
            throw "Could not calculate next index";
        let index = res[0].idx;
        
        // Insert it 
        var sql = "INSERT INTO " + ACTIVE + " (`submission_id`, `system`, `state`, `index`) "
            + " VALUES (?," + JOURNEY + ",?, ?)";
        let row = await DB.queryAsync(sql, [submission.submission_id, State.A.next, index]);
        return row.affectedRows;
    };
    
    obj.setEncounterActive = async (DB, submission) => {
        var indexSQL = "SELECT `index` as idx FROM " + ACTIVE 
                + " WHERE `system` = " + JOURNEY + " AND `state` = ?";
        let res = await DB.queryAsync(indexSQL, [State.A.current]);
        if(!res || !res[0])
            throw "Could not calculate next index";
        let index = res[0].idx;
        
        var subIndexSQL = "SELECT MAX(`subindex`) + 1 as idx FROM " + ACTIVE 
                + " WHERE `index` = ?";
        let subRes = await DB.queryAsync(subIndexSQL, [index]);
        if(!subRes || !subRes[0])
            throw "Could not calculate next subindex";
        let subIndex = subRes[0].idx;
        
        var sql = "INSERT INTO " + ACTIVE + " (`submission_id`, `system`, `state`, `index`, `subindex``) "
            + " VALUES (?," + JOURNEY + ",?, ?, ?)";
        let row = await DB.queryAsync(sql, [submission.submission_id, State.A.encounter, index, subIndex]);
        return row.affectedRows;
    };

    obj.getNextActive = async (DB) => {
        var sql = "SELECT `a`.*, `s`.* "
                + " FROM " + ACTIVE + " AS a"
                    + " LEFT JOIN `game_submission` AS `s`"
                    + " ON `s`.`uid` = `a`.`submission_id`"
                + " WHERE `a`.`system` = " + JOURNEY + " AND `a`.`state` = ?";
        let rows = await DB.queryAsync(sql, [State.A.next]);
        return rows[0];
    };

    obj.getCurrentActive = async (DB) => {
        var sql = "SELECT `a`.*, `s`.* "
                + " FROM " + ACTIVE + " AS `a`"
                    + " LEFT JOIN `game_submission` AS `s`"
                    + " ON `s`.`uid` = `a`.`submission_id`"
                + " WHERE `a`.`system` = " + JOURNEY + " AND `a`.`state` = ?";
        let rows = await DB.queryAsync(sql, [State.A.current]);
        return rows[0];
    };

    return obj;
};