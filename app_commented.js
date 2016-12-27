/*
Summary of what's happening here

1. HTTP requests are the basis of communication in this app. It's how the front end, back end, and APIs relay
   and request information.
    - There's a variety of different request types: Get and Post are the most common. Basically Get retrieves data
      and Post sends data.
    - To send/receive information, you have to send a request to a specific endpoint (an HTTP address) where a program
      runs that can interpret the message. (more on this in the next part)
    - We don't really directly use these - instead we use something called AJAX which uses HTTP get/post methods to
      simplify data transfer. This makes the implementation simpler - when we receive a message we can simply set a
      response message and AJAX takes care of sending it back as a reply.

2. This file gets run by Node.js using an Express.js server
    - Node is a javascript runtime environment that runs server-side (aka on the backend). This pretty much
      means that once you install node on a server, and then you can run any js app on that server simply by
      using the command "node <appName>".
    - Express is a framework for Node.js. What it does is essentially create a port that 'listens' for requests
      and then interprets those requests. So when someone sends a HTTP Request to an endpoint we specify (ie. if
      Twilio sends information to natalnet.ca/server), Express will receive and interpret the message and we can
      work from there.
    - Another way to think about this is that if you have Node running a specific program using Express, then the
      program that it's running 'lives' at the HTTP address that Express specifies. As a result, snding information
      to that address means it'll get passed in directly to the program..

3. We use the Twilio API as a middleman for communication between our app and the client's phone
    - The client sends a text message to our twilio number
    - The Twilio API receives this text message and translates it into computerized data
    - Twilio forwards the contents of the text messages (in the form of an HTTP request) to an endpoint that we
      have specified on our twilio account - the endpoint where we're running our Express server
    - Express receives the message, our app reads the contents and figures our what to do, then we set a reply
      message that gets sent back to Twilio
    - Twilio then relays this reply back to the client's phone
    - Sometimes we send a message to the client without them sending one first, or they send us a message and we
      don't send a reply

 Btw I pulled out the code related to sending out weekly messages and put it in mailingList.js because it was
 unfinished and also kind of unrelated to this whole process.
 */

// Define some constants that are required for Twilio and Firebase
const TWILIO_NUMBER = '+15874092961';
const TWILIO_AUTH_TOKEN = '938457cd6848d3b3d046fa1ca5bdda4a';
const TWILIO_ACCOUNT_SID = 'AC54baa8e971fdca04f235b4c225b2d6ce';
const FIREBASE_KEY = 'AIzaSyDX4YywVXbkppjzPtRfvDzwyC1AMU9BY2U';

// Node is also a package manager - that just means that we can import ('require') the packages/files that we want to
// use (this isn't something you can do normally with javascript)
var firebase = require('firebase');             // this was downloaded
var twilio = require('twilio');                 // this was also downloaded

// Initialize Twilio and Firebase instances
var client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
var config = {
    apiKey: FIREBASE_KEY,
    authDomain: "https://smaccess-226ac.firebaseapp.com",
    databaseURL: "https://smaccess-226ac.firebaseio.com",
    storageBucket: "gs://smaccess-226ac.appspot.com"
};
firebase.initializeApp(config);
var database = firebase.database().ref();

// now whenever we want to interact with Twilio, we do so using the 'client' variable, and whenever we want to
// interact with firebase, we do so using the 'database' variable

/*
Firebase is a real-time database, meaning we can 'listen' to it and get notified when changes occur.
Here we're using that feature to keep track of 2 things: The phone numbers of people who are subscribed to
our service, and the phone numbers of the people who are subscribed who have filled out the 'entrance survey'.
 */
var numbers = [];
var hasFilledSurvey = [];
database.on('child_added', function(snapshot) {                 // When a phone number gets added to the database
    numbers.push( snapshot.key );                               // add that number to the 'numbers' array
    console.log( 'Added number ' + snapshot.key );

    if ( snapshot.hasChild("age") ) {                           // If that phone number has data associated with it
        hasFilledSurvey.push(snapshot.key);                     // add it to the 'hasFilledSurvey' array
        console.log(snapshot.key + " has filled out her entrance survey");
    }
});
/*
Note: we check if data is associated with a phone number when it gets added because when we restart the app,
      Node essentially loads the current Firebase database by registering a bunch of 'child_added' events. So
      basically if we restart the app and don't do this, then we won't know if some of the phone numbers
      have already filled out their entrance survey and we will make them fill it out again.
 */
database.on('child_removed', function(snapshot) {               // When a phone number gets deleted
    var index = numbers.indexOf( snapshot.key );                // Remove it from the 'numbers' array
    numbers.splice(index, 1);

    index = hasFilledSurvey.indexOf( snapshot.key );            // Remove it from the 'hasFilledSurvey' array
    hasFilledSurvey.splice(index, 1);

    console.log('Removed number ' + snapshot.key );
});
database.on('child_changed', function( snapshot ) {             // If data gets changed
    if ( snapshot.hasChild("age") && hasFilledSurvey.indexOf(snapshot.key) === -1) {   // add the number to the
        hasFilledSurvey.push( snapshot.key );                                          // 'hasFilledSurvey' array
        console.log(snapshot.key + " has filled out her entrance survey");             // iff they're not in it already
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
    // Define some important variables
    var resp = new twilio.TwimlResponse();                              // the response we'll send back
    var messageRecieved = request.body.Body.trim().toLowerCase();       // the contents of the texted message
    var fromNum = request.body.From;                                    // the number that sent the message

    var isSubscribed = numbers.indexOf(fromNum) !== -1;                 // is the user already subscribed? (boolean)

    /*
    If the phone number we received the text from is NOT already subscribed, we're going to check if their message
    includes the word 'subscribe' - if it does, add them to Firebase and send them the 'entrance survey'. If it
    doesn't, prompt them to subscribe.
     */
    if (!isSubscribed) {
        if ( messageRecieved.includes('subscribe') ) {
            if( numbers.indexOf(fromNum) !== -1) {          // I just noticed this line is redundant woopsies
                resp.message('You already subscribed!');
            } else {
                // this is the first message we will send (it's the reply to their text)
                resp.message("Thank you, you are now subscribed. Text 'leave' at any point to unsubscribe.");

                client.sendMessage({ to: fromNum, from: TWILIO_NUMBER, body: "Please respond with your " +
                "how far along you are (approx. months), first name, last name, age, and location (in that order). " +
                "For example: 3 John Smith 25 Toronto"});           // this gets sent as a separate message (not part
                                                                    // of the reply)

                database.child(fromNum).set({"name": "unknown"});       // add them to firebase
            }
        } else {
            resp.message('Welcome to NatalNet. Text "Subscribe" to receive weekly personalized pregnancy information.');
        }

        // To send a reply, set resp.message to be the message, and then use set res.end to be resp (srry if it's
        // confusing but you can blame twilio for that)
        res.setHeader('Content-Type', 'text/xml');
        res.end( resp.toString() );
        return;
    }

    /*
    If we get here then we know the phone number is already subscribed. So now we'll check for a few things:
        1. Does it include the word 'leave' (if so, remove their information from firebase)
        2. Have they filled out their entrance survey (if not, assume that the message they have sent is
           their response to the survey. Extract the information and add it to firebase)
        3. If neither of the above, assume they are asking a question
     */

    if ( messageRecieved.includes('leave') ) {          // check if it has the word leave
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

    if (hasFilledSurvey.indexOf(fromNum) === -1) {              // check if they've filled out the survey
        messageRecieved = messageRecieved.split(' ');

        var address = [];
        for (var i=4; i<messageRecieved.length; i++) {
            address.push( messageRecieved[i] );
        }

        var date = new Date().toJSON().slice(0,10);

        database.child(fromNum).set({                          // add their data to Firebase
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

    // add a new node in Firebase under their phone number to hold their question & it's associated data (the
    // keywords in the question and any multimedia)
    var questionRef = database.child(fromNum + "/questions/").push("new node");

    // read the List_Of_Keywords file
    var fs = require('fs');                 // this package lets you read data from a file
    var json = JSON.parse( fs.readFileSync('List_of_Keywords.json','utf-8') );

    // check if the text contains any keywords
    var keywords = [];
    for (var key in json) {
        if (json.hasOwnProperty(key)) {         // this seems redundant too... idk srry
            if( messageRecieved.includes(key) ) {       // if the text message has one of the keywords
                var text = json[key];                   // get the text reply we have specified for that keyword
                if (text) client.sendMessage({to: fromNum, from: TWILIO_NUMBER, body: text});   // send this message
                keywords.push( key );           // add the keyword to our array so we can add it to firebase later
            }
        }
    }

    // extract any multimedia from the message
    // yes this is inefficient but we did this at like 5 am after a million hours of trying to figure out how it works
    // I hate Twilio
    // it's actually super simple but do they have this in their documentation NO THEY DO NOT
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

    // append the question and all information to their 'file' in Firebase
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


// Receive requests from the front end - relay HCWs answers to their recipients(sets up a separate endpoint 
// that Express will listen to and that's where our front end sends information).
// This function literally just interprets the data we get from the front end (the HCW's reply and the phone
// number they are replying to) and sends it to Twilio to send to that phone number.
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