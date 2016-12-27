const TWILIO_NUMBER = '+15874092961';
const TWILIO_AUTH_TOKEN = '938457cd6848d3b3d046fa1ca5bdda4a';
const TWILIO_ACCOUNT_SID = 'AC54baa8e971fdca04f235b4c225b2d6ce';

var twilio = require('twilio');;
var cronJob = require('cron').CronJob;
var fs = require('fs');

// create a REST client
var client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
var frequency = '0 0 1 1 *';

// extract the facts from facts.txt
var facts = fs.readFileSync('facts.txt','utf-8');
facts = facts.split("\n");


// get all the numbers
var numbers = [];
/*
 // To group women into categories based on what trimester they're in:
 rel_con_date = int(month(signup date)) - int(months along)
 rel_con_date <= first_trimester < rel_con_date+3
 rel_con_date+3 <= second_trimester < rel_con_date+6
 rel_con_date+6 <= third_trimester
 */


// send messages out at the specified frequency
var textJob = new cronJob( frequency, function() {
    for( var i = 0; i < numbers.length; i++ ) {
        client.sendMessage({
            to: numbers[i],
            from: TWILIO_NUMBER,
            body: "Happy new year!"
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