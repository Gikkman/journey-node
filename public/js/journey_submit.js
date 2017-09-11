var AJAX_URL = "/ajax";

var alerts = {};
function createAlert(id, type, strong, message){
	if( alerts[id] )
		return;
	alerts[id] = true;

 	 $('#alert').append(
        '<div class="alert alert-' + type + ' fade in" id="' + id +'">' +
            '<a href="#" data-dismiss="alert" aria-label="close" class="close">×</a>' + 
            '<stong><b>' + strong + '</b></strong><br> ' + message + 
		'</div>'
	);
 	$('#' + id).bind('closed.bs.alert', () => {alerts[id] = false;} );
}

function submitQuest(){
    var valid = true;
    var token = $("#token").val();
    var obj = {};
    obj.token = token;
    obj.method = 'submit';

    $( "fieldset" ).each( i => {
        if( this.title.value === '') {
            createAlert('title-warning', 'warning', 'Title required', 'Without a title, how are we supposed to know what game to play?');
            valid = false;
        } else if( this.system.value === '' ) {
            createAlert('system-warning', 'warning', 'System required', 'Knowing which system a game is for makes it far easier to locate!');
            valid = false;
        } else if (this.goal.value === '' ) {
            createAlert('goal-warning', 'warning', 'Goal required', 'Without a goal, it is hard to know what we are suppoed to do. If you don\'t know what to input, I suggest inputting "Beat the game"');
        } else {
            var payload = {};
            payload.title = this.title.value;
            payload.system = this.system.value;
            payload.goal = this.goal.value;
            payload.comments = this.comments.value;
            obj.payload = payload;
        }
    });

    if( valid ){
        post(obj);
    }
}

function resubmit(){
    var token = $("#token").val();
    var obj = {};
    obj.token = token;
    obj.method = 'resubmit';
    
    post(obj);
}

function abandonQuest(){
    var token = $("#token").val();
    var obj = {};
    obj.token = token;
    obj.method = 'abandon';
    
    post(obj);
}

function confirmCompletedQuest(){
    var token = $("#token").val();
    var obj = {};
    obj.token = token;
    obj.method = 'confirm';
    
    post(obj);
}

function post(json){
    $.ajax({
        url: AJAX_URL + "/submit",
        data: json,
        type: 'POST',
        statusCode: {
          403: function() {
            window.location.href = '/auth/twitch/submit';
          }
        },
        success: function(reply) {
           $("div.main-content").replaceWith(reply);
        }
    });
}
