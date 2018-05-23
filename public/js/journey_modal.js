function Modal () {
    this.modal = $('#modal');
    this.modalFooter = $('#modal-footer');
    this.modalBody = $('#modal-body');
    this.modalTitle = $('#modal-header');

    this.buttonIndex = 0;

    this.setButton = function(title, onClick) {
        let buttonID = "modal-btn-" + this.buttonIndex++;
        var b = $('<button ' +
                    ' id="' +buttonID+ '"' +
                    ' type="button"' +
                    ' class="btn btn-primary modal-button"' +
                    ' >' + title + '</button>');

        this.modalFooter.html(b);
        this.modalFooter.on('click', '#' + buttonID, onClick);
    };

    this.setBody = function (content){
        this.modalBody.html('<div>' + content + '</div>');
    };

    this.setTitle = function (title){
        this.modalTitle.text(title);
    };

    this.onClosed = function (callback) {
        this.modal.unbind('hide.bs.modal');
        this.modal.on('hide.bs.modal',callback);
    };

    this.show = function() {
        this.modal.modal({
            show: true,
            focus: true
        });
    };

    this.close = function() {
        this.modal.modal('hide');
    };
};