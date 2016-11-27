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