// scp -i SMaccesS_KP_.pem ~/Desktop/Makequality/app.js ec2-user@ec2-54-169-43-137.ap-southeast-1.compute.amazonaws.com:
// ssh -i SMaccesS_KP_.pem ec2-user@ec2-54-169-43-137.ap-southeast-1.compute.amazonaws.com

/*
 * Part 1: Send weekly messages
 */
const TWILIO_NUMBER = '+15874092961';
const TWILIO_AUTH_TOKEN = '938457cd6848d3b3d046fa1ca5bdda4a';
const TWILIO_ACCOUNT_SID = 'AC54baa8e971fdca04f235b4c225b2d6ce';
const FIREBASE_KEY = 'AIzaSyDX4YywVXbkppjzPtRfvDzwyC1AMU9BY2U';

//require the Twilio module and create a REST client
var twilio = require('twilio');
var client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

var cronJob = require('cron').CronJob;
var frequency = '39 * * * *';

// extract the facts from facts.txt
var fs = require('fs');
var facts = fs.readFileSync('facts.txt','utf-8');
facts = facts.split("\n");
var numbersTemp = ['+17806555108', '+1 289-924-1315', '+1 647-290-0836', '+1 403-988-9438'];

// send messages out at the specified frequency
var textJob = new cronJob( frequency, function() {
    for( var i = 0; i < numbers.length; i++ ) {
        client.sendMessage({
            to: numbersTemp[i],
            from: TWILIO_NUMBER,
            body: facts[i]
        }, function (err, data) {
            if (!err) {
                console.log(data.from);
                console.log(data.body);
            }
        });
    }
}, null, true);


/*
 * Part 2: Set up the server which will receive messages
 */
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


/*
 * Part 3: Connect to Firebase
 */

// connect to the Firebase module
var Firebase = require('firebase'),
usersRef = new Firebase('{FIREBASEURL}/Users/');

var numbers = [];
usersRef.on('child_added', function(snapshot) {
numbers.push( snapshot.val() );
  console.log( 'Added number ' + snapshot.val() );
});

// tell express what to do when the /message route is requested
app.post('/message', function (req, res) {
    var resp = new twilio.TwimlResponse();

    var messageRecieved = req.body.Body.trim().toLowerCase();

    if ( messageRecieved.includes('subscribe') ) {
         resp.message('Thanks for subscribing!');
    } else {
        resp.message(".... subscribe plz");
    }

    res.setHeader('Content-Type', 'text/xml');
    res.end( resp.toString() );
});