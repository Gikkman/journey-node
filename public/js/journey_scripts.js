var URL = "/jp/ajax/submit";

var alerts = {};
function createAlert(id, type, strong, message){
	if( alerts[id] )
		return;
	alerts[id] = true;

 	 $('#alerts').append(
        '<div class="alert alert-' + type + ' fade in" id="' + id +'">' +
            '<a href="#" data-dismiss="alert" aria-label="close" class="close">×</a>' + 
            '<stong><b>' + strong + '</b> <br> </strong>' +
            message + 
		'</div>'
	);
 	$('#' + id).bind('closed.bs.alert', () => {alerts[id] = false;} );
}

function submitForm(){
	var valid = true;
	var token = $("#token").val();
	var obj = {
		token : token
	}  
	
	$( "form" ).each( function( index ) {
		if( this.title.value === '') {
			createAlert('title-warning', 'warning', 'Title reqired', 'Without a title, how are we supposed to know what game to play?')
			valid = false;
		} else if( this.system.value ==='' ) {
			createAlert('system-warning', 'warning', 'System reqired', 'Knowing which system a game is for makes it far easier to locate!')
			valid = false;
		} else {
			var name = 'i' + this.prio.value;
			obj[name] = {
			  	title: this.title.value,
			  	system: this.system.value,
			  	goal: this.goal.value,
			  	comments: this.comments.value,
			};
		}
	});

	if( valid )
		jQuery.post(
			URL,
			obj,
			function(data, status) {
				$("div.main-content").replaceWith(data);
			},
			"html"
		);
}