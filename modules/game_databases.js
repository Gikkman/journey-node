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
        let sqlDelete = "DELETE FROM " + ACTIVE + " WHERE `submission_id` IN"
                        + " ( SELECT `submission_id` FROM"
                            + " (SELECT ga.`submission_id` FROM `game_active` ga"
                                + " JOIN `game_submission` gs"
                                + " ON ga.submission_id = gs.uid"
                                + " WHERE gs.state <> ?"
                                + ") a1"
                        + " )";
        let deleteRow = await DB.queryAsync(sqlDelete, [State.S.active]);
        return { deleted: deleteRow.affectedRows, updated: 0};
    };
    
    obj.deleteSubmissionIfEncounter = async (DB, submission) => {
        if(submission.active_state === State.A.encounter) {
            let sql = "DELTE FROM " + ACTIVE + " WHERE `submission_id` = ?";
            await DB.queryAsync(sql, [submission.submission_id]);            
            return true;
        }
        return false;
    };

    obj.setNextActive = async (DB, submission) => {
        const VOTE_TIMER = global._config.vote_time_init;
        
        let index = await getCurrentIndex(DB);
        index++;
        
        var sql = "INSERT INTO " + ACTIVE + " (`submission_id`, `system`, `state`, `index`, `vote_timer`) "
            + " VALUES (?," + JOURNEY + ", ?, ?, ?)";
        let row = await DB.queryAsync(sql, [submission.submission_id, State.A.active, index, VOTE_TIMER]);
        return row.affectedRows;
    };
    
    obj.setSubindexActive = async (DB, submission) => {
        const VOTE_TIMER = global._config.vote_time_init;
        
        let i = await getNextSubIndex(DB);     
        var sql = "INSERT INTO " + ACTIVE + " (`submission_id`, `system`, `state`, `index`, `subindex`, `vote_timer`) "
            + " VALUES (?," + JOURNEY + ",?, ?, ?, ?)";
        let row = await DB.queryAsync(sql, [submission.submission_id, State.A.active, i.index, i.subIndex, VOTE_TIMER]);
        return row.affectedRows;
    };
    
    obj.setEncounterActive = async (DB, submission) => {
        let i = await getNextSubIndex(DB);     
        var sql = "INSERT INTO " + ACTIVE + " (`submission_id`, `system`, `state`, `index`, `subindex`) "
            + " VALUES (?," + JOURNEY + ",?, ?, ?)";
        let row = await DB.queryAsync(sql, [submission.submission_id, State.A.encounter, i.index, i.subIndex]);
        return row.affectedRows;
    };

    obj.getNextActive = async (DB) => {
        let index = await getCurrentIndex(DB);
        index++;
        let sql = "SELECT `a`.*, `s`.* "
                + " FROM " + ACTIVE + " AS a"
                    + " LEFT JOIN `game_submission` AS `s`"
                    + " ON `s`.`uid` = `a`.`submission_id`"
                + " WHERE `a`.`system` = " + JOURNEY + " AND `a`.`index` = ?";
        let rows = await DB.queryAsync(sql, [index]);
        return rows[0];
    };

    obj.getCurrentActive = async (DB) => {
        let index = await getCurrentIndex(DB);        
        let sql = "SELECT `a`.*, `s`.* "
                + " FROM " + ACTIVE + " AS a"
                    + " LEFT JOIN `game_submission` AS `s`"
                    + " ON `s`.`uid` = `a`.`submission_id`"
                + " WHERE `a`.`system` = " + JOURNEY + " AND `a`.`index` = ?";
        let rows = await DB.queryAsync(sql, [index]);
        return rows[0];
    };
    
    obj.updateVoteTimer = async (DB, submission, vote_timer) => {
        let sql = "UPDATE " + ACTIVE + " SET `vote_timer` = ? WHERE `submission_id` = ?";
        let rows = await DB.queryAsync(sql, [vote_timer, submission.submission_id]);
        return rows.affectedRows;
    };

    return obj;
};

async function getCurrentIndex(DB) {
    var indexSQL = "SELECT min(`index`) as idx FROM " + ACTIVE 
                + " WHERE `subindex` = 0";
    let res = await DB.queryAsync(indexSQL);
    if(!res || !res[0])
        throw "Could not calculate current index";
    let index = res[0].idx;
    
    return index;
}

async function getNextSubIndex(DB) {
    let index = await getCurrentIndex(DB);
    var subIndexSQL = "SELECT MAX(`subindex`) + 1 as idx FROM " + ACTIVE 
                    + " WHERE `index` = ?"
                    + " UNION"
                    + " SELECT MAX(`subindex`) + 1 as idx FROM `gamesplayed`"
                    + " WHERE `index` = ?";
    let subRes = await DB.queryAsync(subIndexSQL, [index, index]);
    if(!subRes || !subRes[0])
        throw "Could not calculate next subindex";
    let subIndex = Math.max(subRes[0].idx, subRes[1].idx);
    
    return { index:index, subIndex:subIndex };
}