module.exports = function(Morgan){
    return Morgan( (tokens, req, res)  => {
        let output = [];

        output.push(tokens.method(req, res));
        output.push(tokens.url(req, res), '-');
        output.push(status(req, res));
        output.push(tokens['response-time'](req, res), 'ms', '-');
        output.push(tokens.res(req, res, 'content-length'));
        output.push(user(req, res));
        
        return output.join(' ');
    });
};

//=======================================================
//==    Private functions
//=======================================================

/**
 * Colorizes the status response
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @returns {string}
 * @private
 */
function status(req, res) {
    var status = headersSent(res)
        ? res.statusCode
        : undefined

    if(status >= 200) {
        return Colors.FG.Green + 200 + Colors.Reset;
    }
    if(status >= 300) {
        return Colors.FG.Cyan + 200 + Colors.Reset;
    }
    if(status >= 400) {
        return Colors.FG.Yellow + 200 + Colors.Reset;
    }
    if(status >= 500) {
        return Colors.FG.Red + 200 + Colors.Reset;
    }
    return Colors.GB.Red + Colors.FG.Black + status + Colors.Reset;
}

/**
 * Colorizes the user
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @returns {string}
 * @private
 */
function user(req, res) {
    if(req.user) {
        return Colors.FG.Magenta + req.user.display_name + Colors.Reset;
    }
    return Colors.Dim + 'Anon' + Colors.Reset;
}

/**
 * Determine if the response headers have been sent.
 *
 * @param {Response} res
 * @returns {boolean}
 * @private
 */
function headersSent (res) {
    return typeof res.headersSent !== 'boolean'
      ? Boolean(res._header)
      : res.headersSent
  }

//=======================================================
//==   Color constants
//=======================================================
const Colors = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",
    FG: {
        Black: "\x1b[30m",
        Red: "\x1b[31m",
        Green: "\x1b[32m",
        Yellow: "\x1b[33m",
        Blue: "\x1b[34m",
        Magenta: "\x1b[35m",
        Cyan: "\x1b[36m",
        White: "\x1b[37m",
        Crimson: "\x1b[38m"
    },
    BG: {
        Black: "\x1b[40m",
        Red: "\x1b[41m",
        Green: "\x1b[42m",
        Yellow: "\x1b[43m",
        Blue: "\x1b[44m",
        Magenta: "\x1b[45m",
        Cyan: "\x1b[46m",
        White: "\x1b[47m",
        Crimson: "\x1b[48m"
    }
};