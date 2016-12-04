var URL = "/jp/act/submit";


function submitForm(){
	var valid = true;
	var token = $("#token").val();
	var obj = {
		token : token
	}
	
	$( "form" ).each( function( index ) {
		if( this.title.value === '') {
			console.log("no title");
			$('#titleMissingAlert').fadeIn();
			$('.close').click( function() {
				$('#titleMissingAlert').fadeOut();
			});
			valid = false;
		} else if( this.system.value ==='' ) {
			console.log("no system");
			$('#systemMissingAlert').fadeIn();
			$('.close').click( function() {
				$('#systemMissingAlert').fadeOut();
			});
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
				console.log(status + ": " + data);
			},
			"json"
		);
}