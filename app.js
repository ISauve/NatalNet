// scp -i SMaccesS_KP_.pem ~/Desktop/Makequality/app.js ec2-user@ec2-54-169-43-137.ap-southeast-1.compute.amazonaws.com:
// ssh -i SMaccesS_KP_.pem ec2-user@ec2-54-169-43-137.ap-southeast-1.compute.amazonaws.com

const TWILIO_NUMBER = '+15874092961';
const TWILIO_AUTH_TOKEN = '938457cd6848d3b3d046fa1ca5bdda4a';
const TWILIO_ACCOUNT_SID = 'AC54baa8e971fdca04f235b4c225b2d6ce';
const FIREBASE_KEY = 'AIzaSyDX4YywVXbkppjzPtRfvDzwyC1AMU9BY2U';

// Initialize firebases
var firebase = require('firebase');
var config = {
    apiKey: FIREBASE_KEY,
    authDomain: "https://smaccess-226ac.firebaseapp.com",
    databaseURL: "https://smaccess-226ac.firebaseio.com",
    storageBucket: "gs://smaccess-226ac.appspot.com"
};

firebase.initializeApp(config);
var database = firebase.database().ref();

var numbers = [];
database.on('child_added', function(snapshot) {
    numbers.push( snapshot.key );
    console.log( 'Added number ' + snapshot.key );
});
database.on('child_removed', function(snapshot) {
    var index = numbers.indexOf( snapshot.key );
    numbers.splice(index, 1);
    console.log('Removed number ' + snapshot.key );
});





// set up the express server
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    path = require('path');

// add support for parsing different types of post data
app.use(bodyParser.json({limit: '2.5mb'}));
app.use(bodyParser.urlencoded({limit: '2.5mb', extended: true}));

// tell express that www is the root of our public web folder
app.use(express.static(path.join(__dirname, 'www')));

// connect to the server
var server = app.listen(process.env.PORT || 3000, function () {
    console.log('Server is running using express.js. Listening on port %d', server.address().port);
});

// tell express what to do when the /message route is requested
app.post('/message', function (req, res) {
    var resp = new twilio.TwimlResponse();
    var messageRecieved = req.body.Body.trim().toLowerCase();
    var fromNum = req.body.From;

    var isSubscribed = numbers.indexOf(fromNum) !== -1;

    if (!isSubscribed) {
        if ( messageRecieved.includes('subscribe') ) {
            if( numbers.indexOf(fromNum) !== -1) {
                resp.message('You already subscribed!');
            } else {
                resp.message("Thank you, you are now subscribed. Text 'karuna' at any point to unsubscribe.");

                client.sendMessage({ to: fromNum, from: TWILIO_NUMBER, body: "Please respond with your " +
                "first name, last name, age, and location (in that order). For example: John Smith 25 Toronto"});
                
                database.child(fromNum).set({"name": "unknown"});
            }
        } else {
            resp.message('Welcome to SMaccesS Updates. Text "Subscribe" to receive updates.');
        }
        res.setHeader('Content-Type', 'text/xml');
        res.end( resp.toString() );
        return;
    }

    if ( messageRecieved.includes('karuna') ) {
        if( numbers.indexOf(fromNum) === -1 ) {
            resp.message("You are not subscribed to this service. Text subscribe if you wish to be.");
        } else {
            resp.message("You're unsubscribed. Text subscribe at any point to re-subscribe.");
            database.child(fromNum).remove();
        }
        res.setHeader('Content-Type', 'text/xml');
        res.end( resp.toString() );
        return;
    }

    messageRecieved = messageRecieved.split(' ');
    database.child(fromNum).set({
        "first name": messageRecieved[0],
        "last name": messageRecieved[1],
        "age": messageRecieved[2],
        "location": messageRecieved[3]
    });

    res.setHeader('Content-Type', 'text/xml');
    res.end( resp.toString() );
});



//require the Twilio module and create a REST client
var twilio = require('twilio');
var client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

var cronJob = require('cron').CronJob;
var frequency = '0 * * * *';

// extract the facts from facts.txt
var fs = require('fs');
var facts = fs.readFileSync('facts.txt','utf-8');
facts = facts.split("\n");

// send messages out at the specified frequency
var textJob = new cronJob( frequency, function() {
    for( var i = 0; i < numbers.length; i++ ) {

        console.log("Texted " + numbers[i]);
        client.sendMessage({
            to: numbers[i],
            from: TWILIO_NUMBER,
            body: "You are still subscribed!"
        }, function (err, data) {
            if (!err) {
                console.log(data.from);
                console.log(data.body);
            } else {
                console.log(err);
            }
        });

    }
}, null, true);
