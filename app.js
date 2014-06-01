var express = require('express');
var path = require('path');
var http = require('http');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes');

var app = express();

var server = http.createServer(app);
var io = require('socket.io').listen(server);

var count = 0;
var played = {};
io.sockets.on('connection', function(socket) {
    count++;
    var symbol = '';
    var color = '';
    if(count % 2 == 1) {
        symbol = 'o';
        color = 'blue';
    } else {
        symbol = 'x';
        color = 'red';
    }

    socket.on('clicked', function(position) {
        played[position.row + "_" + position.col] =  
        {'row': position.row,
        'col': position.col,
        'symbol': symbol,
        'color': color
        };
        var col_win = true;
        var row_win = true;
        var diag_win = true;
        var antidiag_win = true;
        var square = position.row + "_" + position.col;
        var square_symbol = played[square].symbol;
        for(var col = 0; col < 3; col++) {
            if(played[position.row + "_" + col]) {
                if(played[position.row + "_" + col].symbol != square_symbol) {
                    row_win = false;
                }
            } else {
                row_win = false;
            }
        }

        for(var row = 0; row < 3; row++) {
            if(played[row + "_" + position.col]) {
                if(played[row + "_" + position.col].symbol != square_symbol) {
                    col_win = false;
                }
            } else {
                col_win = false;
            }
        }

        if(played[0 + "_" + 0] && played[1 + "_" + 1] && played[2 + "_" + 2]) {
            if(played[0 + "_" + 0].symbol != square_symbol ||
               played[1 + "_" + 1].symbol != square_symbol ||
               played[2 + "_" + 2].symbol != square_symbol) {
                diag_win = false;
            }
        } else {
            diag_win = false;
        }

        if(played[0 + "_" + 2] && played[1 + "_" + 1] && played[2 + "_" + 0]) {
            if(played[0 + "_" + 2].symbol != square_symbol ||
               played[1 + "_" + 1].symbol != square_symbol ||
               played[2 + "_" + 0].symbol != square_symbol) {
                antidiag_win = false;
            }
        } else {
            antidiag_win = false;
        }

        var over = (row_win || col_win || diag_win || antidiag_win);

        socket.broadcast.emit('clicked', {
            'row': position.row,
            'col': position.col,
            'symbol': symbol,
            'color': color,
            'over': over
        });
        socket.emit('played', {
            'row': position.row,
            'col': position.col,
            'symbol': symbol,
            'color': color,
            'over': over
        });
    });

    socket.on('disconnect', function() {
        played = {};
    });

    socket.on('reset', function() {
        played = {};
        io.sockets.emit('reset');
    })
});

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

server.listen(app.get('port'));
console.log('Express server listening on port ' + app.get('port'));
