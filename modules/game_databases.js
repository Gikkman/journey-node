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
    const questModifiableFields = ['title', 'system', 'goal', 'state', 'seconds_played', 'times_played' ];
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

    obj.createSubmission = async (DB, questID, userID, comments, state = State.S.submitted) => {
        var sql = "INSERT INTO " + SUBMISSONS
            + " (`quest_id`, `user_id`, `comments`, `created`, `updated`, `state`)"
            + " VALUES (?,?,?, NOW(), NOW(), ?)";
        let data = await DB.queryAsync(sql, [questID, userID, comments, state]);
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
    
    /**
     * Deletes all entries from ACTIVE that has their underlying submission
     * marked as anything else than 'active'
     */
    obj.deleteEndedActives = async (DB) => {
        var sqlDelete = 
            " DELETE FROM " + ACTIVE + " WHERE uid IN ("
                + " SELECT * FROM ("
                    + " SELECT a.uid FROM game_active a"
                    + " JOIN game_submission s ON a.submission_id = s.uid"
                    + " WHERE s.state <> ?"
                + " ) temp"
            + " );";
    
        let deleteRow = await DB.queryAsync(sqlDelete, [State.S.active]);
        return deleteRow.affectedRows;
    };
    
    obj.advanceActives = async (DB) => {
        var sqlUpdate = "UPDATE " + ACTIVE + " SET "
            + " `state` = ? WHERE `system` = " + JOURNEY + " AND `state` = ?";
        let updateRow = await DB.queryAsync(sqlUpdate, [State.A.current, State.A.next]);
        return updateRow.affectedRows;
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
        
        let index = await obj.getHighestIndex(DB);
        index++;
        
        var sql = "INSERT INTO " + ACTIVE + " (`submission_id`, `system`, `state`, `index`, `vote_timer`) "
            + " VALUES (?," + JOURNEY + ", ?, ?, ?)";
        let row = await DB.queryAsync(sql, [submission.submission_id, State.A.next, index, VOTE_TIMER]);
        return row.affectedRows;
    };
    
    obj.setSubindexActive = async (DB, submission) => {
        const VOTE_TIMER = global._config.vote_time_init;
        
        let i = await getNextSubIndex(DB);     
        var sql = "INSERT INTO " + ACTIVE + " (`submission_id`, `system`, `state`, `index`, `subindex`, `vote_timer`) "
            + " VALUES (?," + JOURNEY + ",?, ?, ?, ?)";
        let row = await DB.queryAsync(sql, [submission.submission_id, State.A.subindex, i.index, i.subIndex, VOTE_TIMER]);
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
        let sql = FULL_GAME_SQL
                + " WHERE `a`.`system` = " + JOURNEY + " AND `a`.`state` = ?";
        let rows = await DB.queryAsync(sql, [State.A.next]);
        return rows[0];
    };

    obj.getCurrentActive = async (DB) => {       
        let sql = FULL_GAME_SQL
                + " WHERE `a`.`system` = " + JOURNEY + " AND `a`.`state` = ?";
        let rows = await DB.queryAsync(sql, [State.A.current]);
        return rows[0];
    };
    
    obj.getSubindexActive = async (DB) => {
        let sql = FULL_GAME_SQL
                + " WHERE `a`.`system` = " + JOURNEY + " AND `a`.`state` = ? AND `s`.`state` = ?";
        return DB.queryAsync(sql, [State.A.subindex, State.S.active]);
    };
    
    obj.updateVoteTimer = async (DB, submission, vote_timer) => {
        let sql = "UPDATE " + ACTIVE + " SET `vote_timer` = ? WHERE `submission_id` = ?";
        let rows = await DB.queryAsync(sql, [vote_timer, submission.submission_id]);
        return rows.affectedRows;
    };
    
    
    //-----------------------------------------------------------
    //              CROSS - QUERIES 
    //-----------------------------------------------------------  
    
    obj.getAllSubmissions = async(DB) => {
        let sql = FULL_GAME_SQL + " WHERE `s`.`state` = ? AND `s`.`deleted` IS NULL";
        return await DB.queryAsync(sql, [State.S.submitted]);
    };
    
    obj.getTotalTime = async(DB) => {
        let sqlGP = "SELECT sum(`seconds_played`) AS `time` FROM gamesplayed";
        let rowGP = await DB.queryAsync(sqlGP, []);
        let sqlGA = "SELECT sum(`seconds_played`) AS `time` FROM " + ACTIVE + " AS a"
                    + " JOIN " + SUBMISSONS + " AS s ON a.submission_id = s.uid";
        let rowGA = await DB.queryAsync(sqlGA, []);
        return rowGP[0].time + rowGA[0].time;
    };
    
    obj.getFullGame = async(DB, submissionID) => {
        let SQL = FULL_GAME_SQL + " WHERE `s`.`submission_id` = ?";
        let row = await DB.queryAsync(SQL, [submissionID]);
        return row[0];
    };
    
    obj.getHighestIndex = async (DB) => {
        /* Calculate the highest index currently in Journey by checking:
         * 1) If the next game has been assigned
         * 2) If the current game has been assigned
         * 3) If there exist a latest review
         * Once one of these holds true, the index of that record is the
         * highest we've assigned. If no records are found, the highest
         * index thus far is 0.
         */
        let index = 0;    

        let record = await obj.getNextActive(DB);
        if( !record )
            record = await obj.getCurrentActive(DB);
        if( !record )
            record = await obj.getLastReview(DB);

        if( record )
            index = record.index;
        
        return index;
    };
    
    //-----------------------------------------------------------
    //              GAMESPLAYED
    //-----------------------------------------------------------  
    
    obj.getLastReview = async (DB) => {
        let sql = "SELECT fg.*, gp.`index`, gp.`subindex` FROM gamesplayed AS gp"
                + " INNER JOIN ( " + FULL_GAME_SQL 
                + " ) AS fg ON gp.submission_id = fg.submission_id"
                + " WHERE gp.subindex = 0 ORDER BY gp.uid DESC LIMIT 1";
        let row = await DB.queryAsync(sql);
        return row[0];
    };
    
    obj.getReview = async (DB, index, subindex = 0) => {
        let sql = "SELECT fg.*, gp.`index`, gp.`subindex` FROM gamesplayed AS gp"
                + " INNER JOIN ( " + FULL_GAME_SQL 
                + " ) AS fg ON gp.submission_id = fg.submission_id"
                + " WHERE gp.`index` = ? AND gp.`subindex` = ?";
        let row = await DB.queryAsync(sql, [index, subindex]);
        return row[0];
    };

    return obj;
};

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

const FULL_GAME_SQL = 
"SELECT `s`.`uid` AS `submission_id`, "
    + " `s`.`quest_id`,"
    + " `s`.`user_id`,"
    + " `s`.`created`,"
    + " `s`.`updated`,"
    + " `s`.`deleted`,"
    + " `s`.`comments`,"
    + " `s`.`state`,"
    + " `s`.`seconds_played`,"
    + " `s`.`start_date`,"
    + " `s`.`end_date`,"
    + " IF(`s`.`dn_override` IS NOT NULL AND `s`.`dn_override` <> '',`s`.`dn_override`, `u`.`display_name`) AS `display_name`,"
    + " `a`.`state` AS `active_state`, "
    + " `a`.`vote_timer`,"
    + " `a`.`index`,"
    + " `a`.`subindex`,"
    + " `q`.`title`, "
    + " `q`.`system`,"
    + " `q`.`goal`,"
    + " `q`.`seconds_played` + `s`.`seconds_played` AS total_seconds_played,"
    + " `q`.`times_played`"
+ " FROM `game_submission` AS `s`"
	+ " LEFT JOIN `game_active` AS `a` ON `s`.`uid` = `a`.`submission_id`"
    + " LEFT JOIN `game_quest` AS `q` ON `q`.`uid` = `s`.`quest_id`"
    + " LEFT JOIN `users` AS `u` ON `u`.`user_id` = `s`.`user_id`";
