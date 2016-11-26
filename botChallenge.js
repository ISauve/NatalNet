'use strict';
const http = require('http');
function play(move, callback) {
    http.request({
        method: 'POST',
        host: '10.172.233.136',
        port: 8080,
        path: '/play/YPFDCGF53G7AEEGTZA2H6FYU'
    }, function(res) {
        res.setEncoding('utf8');
        var data = '';
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            callback(JSON.parse(data));
        });
    }).end(move);
}

function startGame() {
    var upper_bound = 2;
    var lower_bound = 0;
    var random_number = Math.round(Math.random()*(upper_bound - lower_bound) + lower_bound);

    var move;
    switch (random_number ) {
        case 0: move = 'rock'; break;
        case 1: move = 'paper'; break;
        case 2: move =  'scissors'; break;
        default: move = 'rock';
    }
    setTimeout(function() {
        play(move, function(obj) {
            console.log(JSON.stringify(obj));
            startGame();
        });
    }, 1000);
}

startGame();
