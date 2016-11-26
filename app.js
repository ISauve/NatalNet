// scp -r -i SMaccesS_KP_.pem ~/Desktop/Makequality ec2-user@ec2-54-169-43-137.ap-southeast-1.compute.amazonaws.com:

const TWILIO_NUMBER = '+15874092961';
const TWILIO_AUTH_TOKEN = '938457cd6848d3b3d046fa1ca5bdda4a';
const TWILIO_ACCOUNT_SID = 'AC54baa8e971fdca04f235b4c225b2d6ce';

//require the Twilio module and create a REST client
var twilio = require('twilio');
var client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
var cronJob = require('cron').CronJob;
var frequency = '0 18 * * 6'; // Every saturday at 6:00pm
var numbers = ['+17806555108', '+1 289-924-1315', '+1 647-290-0836'];

var textJob = new cronJob( frequency, function(){

    for( var i = 0; i < numbers.length; i++ ) {

        client.sendMessage({
            to: numbers[i],
            from: TWILIO_NUMBER,
            body: 'Bison!'
        }, function (err, data) {
            if (!err) {
                console.log(data.from);
                console.log(data.body);
            }
        });
    }
}, null, true);




var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    path = require('path');

// add support for parsing different types of post data
app.use(bodyParser.json({limit: '2.5mb'}));
app.use(bodyParser.urlencoded({limit: '2.5mb', extended: true}));

// tell express that www is the root of our public web folder
app.use(express.static(path.join(__dirname, 'www')));

// Waits for connection
var server = app.listen(process.env.PORT || 3000, function () {
    console.log('Server is running using express.js. Listening on port %d', server.address().port);
});

// tell express what to do when the /message route is requested
app.post('/message', function (req, res) {

    console.log("Received a request!");

    var resp = new twilio.TwimlResponse();
    resp.message('f u man');

    res.setHeader('Content-Type', 'text/xml');
    res.end( resp.toString() );
});