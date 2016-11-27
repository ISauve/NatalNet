const TWILIO_NUMBER = '+15874092961';
const TWILIO_AUTH_TOKEN = '938457cd6848d3b3d046fa1ca5bdda4a';
const TWILIO_ACCOUNT_SID = 'AC54baa8e971fdca04f235b4c225b2d6ce';

// set up the express server
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    path = require('path');

//require the Twilio module and create a REST client
var twilio = require('twilio');
var client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

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
    var msid = req.body.MessageSid;

    // check if they sent multimedia
    if (msid[0] === 'M') {
        var mediaURLS = [];
        if ( req.body.MediaUrl0 ) mediaURLS.push( req.body.MediaUrl0  );
        if ( req.body.MediaUrl1 ) mediaURLS.push( req.body.MediaUrl1  );
        if ( req.body.MediaUrl2 ) mediaURLS.push( req.body.MediaUrl2  );
        if ( req.body.MediaUrl3 ) mediaURLS.push( req.body.MediaUrl3  );
        if ( req.body.MediaUrl4 ) mediaURLS.push( req.body.MediaUrl4  );
        if ( req.body.MediaUrl5 ) mediaURLS.push( req.body.MediaUrl5  );
        if ( req.body.MediaUrl6 ) mediaURLS.push( req.body.MediaUrl6  );
        if ( req.body.MediaUrl7 ) mediaURLS.push( req.body.MediaUrl7  );
        if ( req.body.MediaUrl8 ) mediaURLS.push( req.body.MediaUrl8  );
        if ( req.body.MediaUrl9 ) mediaURLS.push( req.body.MediaUrl9  );

        for (var i=0; i< mediaURLS.length; i++) {
            console.log(mediaURLS[i]);
        }
    }

    resp.message("We're in a new file now.... wooooow...");

    res.setHeader('Content-Type', 'text/xml');
    res.end( resp.toString() );
});
