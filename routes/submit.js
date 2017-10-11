var express = require('express');
module.exports = function (TokenDatabase, GameDatabases) {
    var router = express.Router();
    var counter = 0;
    router.get('/', isAuthenticated, async (req, res) => {
        try {
            var user = req.user;
            var token = await TokenDatabase.createToken(user);
            var submission = await GameDatabases.getSubmissionByUserID(user.user_id);
            var state;

            req.session.counter = counter++;

            if (submission) {
                var quest = await GameDatabases.getQuestByID(submission.quest_id);

                submission.title = quest.title;
                submission.system = quest.system;
                submission.goal = quest.goal;
                submission.time = toHhmmss(submission.seconds_played + quest.seconds_played);

                // States are in lower case. This will upper case the leading char
                let temp = submission.state;
                temp = temp.charAt(0).toUpperCase() + temp.slice(1);
                submission.state = temp;

                if(submission.active_state){
                    let temp = submission.active_state;
                    temp = temp.charAt(0).toUpperCase() + temp.slice(1);
                    submission.active_state = temp;
                }

                // For the view
                state = submission.state;
            }

            res.render('submit', {token: token, submission: submission, state: state});
        } catch (e) {
            errorResponse(res, e, "Unexpected error when setting up submission form");
        }
    });

    return router;
};

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        next();
    else
        res.redirect('/auth/twitch/submit');
}

function errorResponse(res, error, message) {
    var title = error ? error.message : "";
    res.render('error', {title: title, status: 1001, message: message});
}

function toHhmmss(sec) {
    var hours = Math.floor(sec / 3600);
    var minutes = Math.floor((sec - (hours * 3600)) / 60);
    var seconds = sec - (hours * 3600) - (minutes * 60);

    if (hours < 10)
        hours = "0" + hours;
    if (minutes < 10)
        minutes = "0" + minutes;
    if (seconds < 10)
        seconds = "0" + seconds;
    return hours + ':' + minutes + ':' + seconds;
}