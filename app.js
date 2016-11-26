/*
 * Sending weekly messages
 */


// test code for sending out weekly messages using Twilio and cron
var twilio = require('twilio'),
    client = twilio('ACCOUNTSID', 'AUTHTOKEN'),
    cronJob = require('cron').CronJob;

var frequency = '0 18 * * 16'; // Every saturday at 6:00pm

var textJob = new cronJob( frequencyn, function(){
    client.sendMessage( {
        to:'YOURPHONENUMBER',
        from:'YOURTWILIONUMBER',
        body:'Hello! Hope you’re having a good day!'
    }, function( err, data ) {});
},  null, true);
