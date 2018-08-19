var express = require('express');
const State = global._state;
const Config = global._config;

module.exports = function (MySQL, GameDatabases) {
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
            let time = await GameDatabases.getTotalTime(MySQL);
            
            res.status(200).json( {
                total_time_seconds: time
            });
        } catch (e) {
            errorLogAndSend(res, e);
        }
    });
    
    router.get('/raffleblocked', isAuthenticated, async (req, res) => {
        try {
            let current = await GameDatabases.getCurrentActive(MySQL);
            let previous = await GameDatabases.previousGame(MySQL);
            
            res.status(200).json( {
                blocked: [
                    {won: current.index, user_id: current.user_id},
                    {won: previous.index, user_id: previous.user_id}
                ]
            });
        } catch (e) {
            errorLogAndSend(res, e);
        }
    });
    
    router.get('/currentindex', isAuthenticated, async (req, res) => {
        try {
            let current = await GameDatabases.getCurrentActive(MySQL);
            
            res.status(200).json( {
                index: current.index
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