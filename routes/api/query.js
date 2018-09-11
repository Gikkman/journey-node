var express = require('express');
const State = global._state;
const Config = global._config;

module.exports = function (MySQL, GameDatabases, GameDatabasesCrossQuery) {
    var router = express.Router();
    
    router.get('/actives', isAuthenticated, async (req, res) => {
        try {
            let current = await GameDatabases.getCurrentActive(MySQL);
            let next = await GameDatabases.getNextActive(MySQL);
            let subindices = await GameDatabases.getSubindexActive(MySQL);
            
            cleanSubmission(current, next, subindices);
            
            res.status(200).json( {
                current: current,
                next: next,
                subindices: subindices
            });
        } catch (e) {
            errorLogAndSend(res, e);
        }
    });
    
    router.get('/allsubmissions', isAuthenticated, async (req, res) => {
        try {
            let allSubmissions = await GameDatabases.getAllSubmissions(MySQL);
            
            cleanSubmission(allSubmissions);
            
            res.status(200).json( {
                all: allSubmissions
            });
        } catch (e) {
            errorLogAndSend(res, e);
        }
    });
    
    router.get('/totaltime', isAuthenticated, async (req, res) => {
        try {
            let time = await GameDatabasesCrossQuery.getTotalTime(MySQL);
            
            res.status(200).json( {
                total_time_seconds: time
            });
        } catch (e) {
            errorLogAndSend(res, e);
        }
    });
    
    router.get('/raffleblocked', isAuthenticated, async (req, res) => {
        /**
         * Users are blocked from a raffle for 5 wins after they have won. So
         * say a user wins raffle #100, then they cannot win raffle #101 nor
         * #102, #103, #104 and #105, but they can win again #106.
         * 
         * To find the blocked users, we need to consider both the currently 
         * active games and reviews, since the index might be in past time or 
         * it might cover currently active games. We then filter out those games
         * which's indices are not in the desired range, then return those we 
         * found.
         * 
         * The returned set might be empty
         */
        try {
            let index = req.query.index;
            
            let current = await GameDatabases.getCurrentActive(MySQL);
            let next = await GameDatabases.getNextActive(MySQL);
            let review1 = await GameDatabases.getReview(MySQL, index - 1);
            let review2 = await GameDatabases.getReview(MySQL, index - 2);
            let review3 = await GameDatabases.getReview(MySQL, index - 3);
            let review4 = await GameDatabases.getReview(MySQL, index - 4);
            let review5 = await GameDatabases.getReview(MySQL, index - 5);
            
            cleanSubmission(next, current, review1, review2, review3, review4, review5);
            let arr = [next, current, review1, review2, review3, review4, review5]
                    .filter(n => n !== undefined)
                    .filter(n => n.index >= index - 5 && n.index < index)
                    .map(n => ({
                        won: n.index,
                        user_id: n.user_id
                    }));
            
            res.status(200).json( {
                blocked: arr
            });
        } catch (e) {
            errorLogAndSend(res, e);
        }
    });
    
    router.get('/highestindex', isAuthenticated, async (req, res) => {
        try {
            let index = await GameDatabasesCrossQuery.getHighestIndex(MySQL);
            
            res.status(200).json( {
                index: index
            });
        } catch (e) {
            errorLogAndSend(res, e);
        }
    });
    
    router.get('/submissionstatistics', isAuthenticated, async (req, res) => {
        try {
            let stats = await GameDatabasesCrossQuery.getSubmissionsStatistics(MySQL);
            res.status(200).json( {
                stats
            });           
        } catch (e) {
            errorLogAndSend(res, e);
        }
    });
    
    router.get('/suspendedsubmissions', isAuthenticated, async (req, res) => {
        try {
            let suspended = await GameDatabasesCrossQuery.getSuspended(MySQL);
            cleanSubmission(suspended);
            res.status(200).json( {
                suspended: suspended
            });           
        } catch (e) {
            errorLogAndSend(res, e);
        }
    });
    
    //=======================================================
    //==    Misc endpoints
    //=======================================================

    router.get('/ping', isAuthenticated, async (req, res) => {
       try {
            res.status(200).send("OK - Query");
       } catch (e) {
            errorLogAndSend(res, e);
       }
    });

    return router;

    //=======================================================
    //==    Internal
    //=======================================================
    async function isAuthenticated(req, res, next) {
        if (req.headers.apikey === Config.api_key) {
            next();
        } else {
            res.status(401).send("Unauthorized");
        }
    }

    function errorLogAndSend(res, error) {
        console.log( error instanceof Error ? error.stack : error);
        res.status(500).send(error instanceof Error ? error.message : error);
    }
    
    function cleanSubmission(...sx) {
        let s = sx.reduce((acc, val) => acc.concat(val), []);
        for(let sub of s) {
            if(!sub) continue;
            delete sub.created;
            delete sub.updated;
            delete sub.deleted;
            
            let index = sub.index;
            let subindex = sub.subindex;
            delete sub.subindex;
            sub.index = index + subindexToString(subindex);
        }
    }
};

const A = ['', '-B', '-C', '-D', '-E', '-F', '-G', '-H', '-I', '-J', '-K', 
           '-L', 'M', '-N', '-O', '-P', '-Q','-R', '-S', '-T', '-U', '-V', 
           '-W', '-X', '-Y', '-Z'];
function subindexToString(subindex) {
    return A[subindex];
}