module.exports = function(GameDatabases) {
	var obj = {};

	obj.getAbandoned = async (DB) => {
            return await DB.queryAsync(getAbandonedQuery);
	};
        
	obj.getSuspended = async (DB) => {
            return await DB.queryAsync(getSuspendedQuery);
	};
        
	obj.getLimbo = async (DB) => {
            return await DB.queryAsync(getLimboQuery);
	};
        
        obj.getCompleted = async (DB) => {
            return await DB.queryAsync(getCompletedQuery);
        };
        
        obj.getSubmitted = async (DB) => {
            return await DB.queryAsync(getSubmittedQuery);
        };
        
        obj.getActive = async (DB) => {
            return await DB.queryAsync(getActiveQuery);
        };
        
        obj.getSubmissionsStatistics = async (DB) => {
            let abandoned = await DB.queryAsync(getAbandonedQuery);
            let suspended = await DB.queryAsync(getSuspendedQuery);
            let limbo = await DB.queryAsync(getLimboQuery);
            let completed = await DB.queryAsync(getCompletedQuery);
            let submitted = await DB.queryAsync(getSubmittedQuery);
            let active = await DB.queryAsync(getActiveQuery);
            
            return {
                abandoned: abandoned.length,
                suspended: suspended.length,
                limbo: limbo.length,
                completed: completed.length,
                submitted: submitted.length,
                active: active.length
            };
        };
        
        obj.getTotalTime = async(DB) => {
            let sql = "SELECT SUM(`seconds_played`) AS `time` FROM `game_submission`";
            let row = await DB.queryAsync(sql, []);
            return row[0].time;
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

            let record = await GameDatabases.getNextActive(DB);
            if( !record )
                record = await GameDatabases.getCurrentActive(DB);
            if( !record )
                record = await GameDatabases.getLastReview(DB);

            if( record )
                index = record.index;

            return index;
        };
        
        obj.getNextSubIndex = async (DB) => {
            let index = await obj.getHighestIndex(DB);
            var subIndexSQL = "SELECT MAX(`subindex`) + 1 as idx FROM `game_active`" 
                            + " WHERE `index` = ?"
                            + " UNION"
                            + " SELECT MAX(`subindex`) + 1 as idx FROM `gamesplayed`"
                            + " WHERE `index` = ?";
            let subRes = await DB.queryAsync(subIndexSQL, [index, index]);
            if(!subRes || !subRes[0])
                throw "Could not calculate next subindex";
            let subIndex = Math.max(subRes[0].idx, subRes[1].idx);

            return { index:index, subIndex:subIndex };
        };
    
	return obj;
} ;

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

// Get abandoned
let getAbandonedQuery = FULL_GAME_SQL +
" WHERE q.uid NOT IN (                                                                        " +
"   SELECT s.quest_id FROM `game_submission` s                                                " +
"   WHERE deleted IS NULL                                                                     " +
"     OR s.state = 'completed'                                                                " +
"     OR s.state = 'active'                                                                   " +
" )                                                                                           " +
" GROUP BY q.uid;                                                                             " ;

// Get completed
let getCompletedQuery = FULL_GAME_SQL +
" WHERE s.state = 'completed';                                                                " ;

// Get suspended
let getSuspendedQuery = FULL_GAME_SQL +
" WHERE s.state = 'suspended'                                                                 " +
" AND s.deleted IS NULL;                                                                      " ;

// Get actives
let getActiveQuery = FULL_GAME_SQL +
" WHERE s.state = 'active'                                                                    " +
" AND s.deleted IS NULL;                                                                      " ;

// Get submitted
let getSubmittedQuery = FULL_GAME_SQL +
" WHERE s.state = 'submitted'                                                                 " +
" AND s.deleted IS NULL;                                                                      " ;

// Get limbo
let getLimboQuery = FULL_GAME_SQL +
" WHERE (s.state = 'voted out'  AND s.deleted IS NULL)                                        " ;