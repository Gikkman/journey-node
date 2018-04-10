var API_URL = "/api";

$( () => {
    $('[data-toggle="popover"]').popover();
    $('[data-toggle=confirmation]').confirmation({
        rootSelector: '[data-toggle=confirmation]',
        popout: true,
        singleton: true
    });
    
});
 
var alerts = {};
function createAlert(id, type, strong, message) {
    if (alerts[id])
        return;
    alerts[id] = true;

    $('#alert').append(
        '<div class="alert alert-' + type + ' fade in" id="' + id + '">' +
        '<a href="#" data-dismiss="alert" aria-label="close" class="close">×</a>' +
        '<stong><b>' + strong + '</b></strong><br> ' + message +
        '</div>'
        );
    $('#' + id).bind('closed.bs.alert', () => {
        alerts[id] = false;
    });
}

function submitQuest() {
    var valid = false;
    var token = $("#token").val();
    var obj = {};
    obj.token = token;
    obj.method = 'submit';

    $("fieldset").each(i => {
        if (this.QuestTitle.value === '') {
            createAlert('title-warning', 'warning', 'Title required', 'Without a title, how are we supposed to know what game to play?');
        } else if (this.QuestSystem.value === '') {
            createAlert('system-warning', 'warning', 'System required', 'Knowing which system a game is for makes it far easier to locate!');
        } else if (this.QuestGoal.value === '') {
            createAlert('goal-warning', 'warning', 'Goal required', 'Without a goal, it is hard to know what we are suppoed to do. If you don\'t know what to input, I suggest inputting "Beat the game"');
        } else {
            var payload = {};
            payload.title = this.QuestTitle.value;
            payload.system = this.QuestSystem.value;
            payload.goal = this.QuestGoal.value;
            payload.comments = this.SubmissionComments.value;
            obj.payload = payload;

            valid = true;
        }
    });

    if (valid) {
        post(obj);
    }
}

function resubmit() {
    var token = $("#token").val();
    var obj = {};
    obj.token = token;
    obj.method = 'resubmit';

    post(obj);
}

function abandonQuest() {
    var token = $("#token").val();
    var obj = {};
    obj.token = token;
    obj.method = 'abandon';

    post(obj);
}

function confirmCompletedQuest() {
    var token = $("#token").val();
    var obj = {};
    obj.token = token;
    obj.method = 'confirm';

    post(obj);
}

function post(json) {
    $.ajax({
        url: API_URL + "/submit",
        data: json,
        type: 'POST',
        statusCode: {
            403: function () {
                window.location.href = '/auth/twitch/submit';
            }
        },
        success: function (reply) {
            $("div.main-content").replaceWith(reply);
        }
    });
}
