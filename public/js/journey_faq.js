$(document).ready(function () {
    //attaching the event listener
    $(window).on('hashchange', function () {
        var hash = window.location.hash;
        $('html, body').animate({scrollTop: $(hash).offset().top -100}, 0);
    });

    //manually tiggering it if we have hash part in URL
    if (window.location.hash) {
        $(window).trigger('hashchange');
    }
});

function navigate(id){
    $('html, body').animate({scrollTop: $('#'+id).offset().top -100}, 0);
}
