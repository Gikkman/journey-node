module.exports = function(){
    var mod = {};
    
    mod.toHhmmss = (sec) => {
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

    mod.today = () => {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();

        if(dd<10) dd = '0'+dd
        if(mm<10) mm = '0'+mm
        return dd + '-' + mm + '-' + yyyy;
    }

    return mod;
} ;