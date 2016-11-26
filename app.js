/*
 * Sending weekly messages
 */


// test code for sending out weekly messages using Twilio and cron
var twilio = require('twilio'),
    client = twilio('ACCOUNTSID', 'AUTHTOKEN'),
    cronJob = require('cron').CronJob;

var frequency = '0 18 * * 16'; // Every saturday at 6:00pm
var numbers = ['YOURPHONENUMBER', 'YOURFRIENDSPHONENUMBER'];

var textJob = new cronJob( frequency, function(){
    for( var i = 0; i < numbers.length; i++ ) {
        client.sendMessage({
            to: numbers[i],
            from: 'YOURTWILIONUMBER',
            body: 'Hello! Hope you’re having a good day!'
        }, function (err, data) {
        });
    }
},  null, true);