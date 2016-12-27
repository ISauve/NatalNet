// scp -i SMaccesS_KP_.pem ~/Desktop/NatalNet/index.html ec2-user@ec2-54-169-43-137.ap-southeast-1.compute.amazonaws.com: ../../.   ./var/www/html/
// ssh -i SMaccesS_KP_.pem ec2-user@ec2-54-169-43-137.ap-southeast-1.compute.amazonaws.com

const TWILIO_NUMBER = '+15874092961';
const TWILIO_AUTH_TOKEN = '938457cd6848d3b3d046fa1ca5bdda4a';
const TWILIO_ACCOUNT_SID = 'AC54baa8e971fdca04f235b4c225b2d6ce';
const FIREBASE_KEY = 'AIzaSyDX4YywVXbkppjzPtRfvDzwyC1AMU9BY2U';

var firebase = require('firebase');
var twilio = require('twilio');
var client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Initialize firebases
var config = {
    apiKey: FIREBASE_KEY,
    authDomain: "https://smaccess-226ac.firebaseapp.com",
    databaseURL: "https://smaccess-226ac.firebaseio.com",
    storageBucket: "gs://smaccess-226ac.appspot.com"
};

firebase.initializeApp(config);
var database = firebase.database().ref();

var numbers = [];
var hasFilledSurvey = [];
database.on('child_added', function(snapshot) {
    numbers.push( snapshot.key );
    console.log( 'Added number ' + snapshot.key );

    if ( snapshot.hasChild("age") ) {
        hasFilledSurvey.push(snapshot.key);
        console.log(snapshot.key + " has filled out her entrance survey");
    }
});
database.on('child_removed', function(snapshot) {
    var index = numbers.indexOf( snapshot.key );
    numbers.splice(index, 1);

    index = hasFilledSurvey.indexOf( snapshot.key );
    hasFilledSurvey.splice(index, 1);

    console.log('Removed number ' + snapshot.key );
});
database.on('child_changed', function( snapshot ) {
    if ( snapshot.hasChild("age") && hasFilledSurvey.indexOf(snapshot.key) === -1) {
        hasFilledSurvey.push( snapshot.key );
        console.log(snapshot.key + " has filled out her entrance survey");
    }
});


// set up Express server
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

// tell the server that when a person sends a request to the /message endpoint, it should run this function
app.post('/message', function (request, res) {
    var resp = new twilio.TwimlResponse();
    var messageRecieved = request.body.Body.trim().toLowerCase();
    var fromNum = request.body.From;

    var isSubscribed = numbers.indexOf(fromNum) !== -1;

    if (!isSubscribed) {
        if ( messageRecieved.includes('subscribe') ) {
            if( numbers.indexOf(fromNum) !== -1) {
                resp.message('You already subscribed!');
            } else {
                resp.message("Thank you, you are now subscribed. Text 'leave' at any point to unsubscribe.");

                client.sendMessage({ to: fromNum, from: TWILIO_NUMBER, body: "Please respond with your " +
                "how far along you are (approx. months), first name, last name, age, and location (in that order). " +
                "For example: 3 John Smith 25 Toronto"});

                database.child(fromNum).set({"name": "unknown"});
            }
        } else {
            resp.message('Welcome to NatalNet. Text "Subscribe" to receive weekly personalized pregnancy information.');
        }
        res.setHeader('Content-Type', 'text/xml');
        res.end( resp.toString() );
        return;
    }

    if ( messageRecieved.includes('leave') ) {
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

    if (hasFilledSurvey.indexOf(fromNum) === -1) {
        messageRecieved = messageRecieved.split(' ');

        var address = [];
        for (var i=4; i<messageRecieved.length; i++) {
            address.push( messageRecieved[i] );
        }

        var date = new Date().toJSON().slice(0,10);

        database.child(fromNum).set({
            "months_along": messageRecieved[0],
            "first_name": messageRecieved[1],
            "last_name": messageRecieved[2],
            "age": messageRecieved[3],
            "location": address.join(' '),
            "signup_date": date
        });

        resp.message("Thanks for signing up! Feel free to ask any questions you may have regarding you or your " +
            "babies health. You may include pictures or video if it helps. Please note this is not an emergency service.");
        res.setHeader('Content-Type', 'text/xml');
        res.end( resp.toString() );
        return;
    }

    // If they are not subscribing, unsubscribing, or filling out their entrance survey
    // assume they are asking a question

    var questionRef = database.child(fromNum + "/questions/").push("new node");

    // parse string looking for keywords
    var fs = require('fs');
    var json = JSON.parse( fs.readFileSync('List_of_Keywords.json','utf-8') );

    // fetch the keywords
    var keywords = [];
    for (var key in json) {
        if (json.hasOwnProperty(key)) {
            if( messageRecieved.includes(key) ) {
                var text = json[key];
                if (text) client.sendMessage({to: fromNum, from: TWILIO_NUMBER, body: text});
                keywords.push( key );
            }
        }
    }

    // fetch any multimedia
    var mediaURLS = [];
    var msid = req.body.MessageSid;
    if (msid[0] === 'M') {
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
    }

    // append the question and all information
    database.child(fromNum + "/questions/" + questionRef.key ).set({
        "question": messageRecieved,
        "keywords":  keywords.join(" "),
        "media": mediaURLS.join(" ")
    });

    resp.message("Your question has been logged and a healthcare worker will be in contact with you soon! " +
        "Automated information may follow depending on the content of your question and remember that NatalNet " +
        "is not an emergency service, and responses may take some time." +
        "If you are in an emergency health situation, contact emergency first aid professionals.");

    res.setHeader('Content-Type', 'text/xml');
    res.end( resp.toString() );
});


// receive requests from the front end - relay HCWs answers to their recipients
app.post('/answers', function (request, response) {
    var message = request.body.answer;
    var number = request.body.phoneNumber;

    client.sendMessage({
        to: number,
        from: TWILIO_NUMBER,
        body: message
    }, function (err, data) {
        if (!err) {
            console.log(data.from);
            console.log(data.body);
        } else {
            console.log(err);
        }
    });
});