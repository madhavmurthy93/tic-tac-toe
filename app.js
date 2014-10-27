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

// Check if game is over.
function game_over(position, played) {
    var col_win = true;
    var row_win = true;
    var diag_win = true;
    var antidiag_win = true;
    var square_symbol = played[position.row + "_" + position.col].symbol;
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

    return (row_win || col_win || diag_win || antidiag_win);
}

// Check if game is a draw.
function game_draw(moves) {
    if(moves == 9) {
        return true;
    }
    return false;
}

// Update the clients spectating the game.
function update_spectators(socket) {
    var sockets = io.sockets.adapter.rooms[socket.room];
    for (var socketId in sockets) {
        var client = io.sockets.connected[socketId];
        if (!client.player) {
            socket.to(socketId).emit('spectator');
        }
    }
}

var rooms = {};
io.sockets.on('connection', function(socket) {
    socket.on('load', function(id) {
        if(!rooms[id]) {
            rooms[id] = {
                'players': 0,
                'played': {},
                'moves': 0,
                'specs': 0
            }
        }
        var symbol = '';
        var color = '';
        if(rooms[id].players < 2) {
            rooms[id].players += 1;
            if(rooms[id].players % 2 == 1) {
                symbol = 'o';
                color = '#5E84CF';
            } else {
                symbol = 'x';
                color = '#FF6262';
            }
            socket.player = true;
            socket.symbol = symbol;
            socket.color = color;
        } else {
            rooms[id].specs += 1;
            socket.player = false; 
            socket.emit('spectator');
        }
        socket.emit('update', rooms[id].played);
        socket.room = id;
        socket.join(id);
    });

    socket.on('clicked', function(position) {
        var played = rooms[socket.room].played;
        played[position.row + "_" + position.col] =  
        {'row': position.row,
        'col': position.col,
        'symbol': socket.symbol,
        'color': socket.color
        };
        rooms[socket.room].moves++;
        var over = game_over(position, played);
        var draw = game_draw(rooms[socket.room].moves);
        socket.broadcast.to(socket.room).emit('clicked', {
            'row': position.row,
            'col': position.col,
            'symbol': socket.symbol,
            'color': socket.color,
            'over': over,
            'draw': draw
        });
        socket.emit('played', {
            'row': position.row,
            'col': position.col,
            'symbol': socket.symbol,
            'color': socket.color,
            'over': over,
            'draw': draw
        });
        update_spectators(socket);
    });

    socket.on('reset', function() {
        rooms[socket.room].played = {};
        rooms[socket.room].moves = 0;
        io.sockets.to(socket.room).emit('reset');
        update_spectators(socket);
    });

    socket.on('disconnect', function() {
        if (socket.player) {
            rooms[socket.room].played = {};
            rooms[socket.room].moves = 0;
            rooms[socket.room].players -= 1;
            io.sockets.to(socket.room).emit('reset');
        } else {
            rooms[socket.room].specs -= 1;
        }
        update_spectators(socket);
    });
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
app.get('/:id', routes.game);

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
