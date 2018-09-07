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
    
	return obj;
} ;


// Get abandoned
let getAbandonedQuery =
" SELECT q.uid, q.title, q.system, q.goal, q.times_played, q.seconds_played FROM game_quest q " +
" JOIN game_submission s ON s.quest_id = q.uid                                                " +
" WHERE q.uid NOT IN (                                                                        " +
"   SELECT s.quest_id FROM `game_submission` s                                                " +
"   WHERE deleted IS NULL                                                                     " +
"     OR s.state = 'completed'                                                                " +
"     OR s.state = 'active'                                                                   " +
" )                                                                                           " +
" GROUP BY q.uid;                                                                             " ;

// Get completed
let getCompletedQuery =
" SELECT q.uid, q.title, q.system, q.goal, q.times_played, q.seconds_played FROM game_quest q " +
" JOIN game_submission s ON s.quest_id = q.uid                                                " +
" WHERE s.state = 'completed';                                                                " ;

// Get suspended
let getSuspendedQuery =
" SELECT q.uid, q.title, q.system, q.goal, q.times_played, q.seconds_played FROM game_quest q " +
" JOIN game_submission s ON s.quest_id = q.uid                                                " +
" WHERE s.state = 'suspended'                                                                 " +
" AND s.deleted IS NULL;                                                                      " ;

// Get actives
let getActiveQuery =
" SELECT q.uid, q.title, q.system, q.goal, q.times_played, q.seconds_played FROM game_quest q " +
" JOIN game_submission s ON s.quest_id = q.uid                                                " +
" WHERE s.state = 'active'                                                                    " +
" AND s.deleted IS NULL;                                                                      " ;

// Get submitted
let getSubmittedQuery =
" SELECT q.uid, q.title, q.system, q.goal, q.times_played, q.seconds_played FROM game_quest q " +
" JOIN game_submission s ON s.quest_id = q.uid                                                " +
" WHERE s.state = 'submitted'                                                                 " +
" AND s.deleted IS NULL;                                                                      " ;

// Get limbo
let getLimboQuery =
" SELECT q.uid, q.title, q.system, q.goal, q.times_played, q.seconds_played FROM game_quest q " +
" JOIN game_submission s ON s.quest_id = q.uid                                                " +
" WHERE (s.state = 'voted out'  AND s.deleted IS NULL)                                        " ;