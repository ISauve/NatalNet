// link to the Firebase database
var JSONURL = 'https://smaccess-226ac.firebaseio.com/.json';

// download the data
function downloadData(url) {
    var xhttp = new XMLHttpRequest();
    xhttp.open( "GET", url, false );
    xhttp.send( null );
    return xhttp.responseText;
}
var data = downloadData(JSONURL);
var obj = JSON.parse(data);

// parse through all the nodes in the database
for (var i = 0; i < Object.keys(obj).length; i++){

    // pull out the phone number for a particular node
    var phone = Object.keys(obj)[i];

    // make an object containing all the info on a particular phone number
    var val = Object.values(obj);
    var info = val[i];

    // get all the questions a person asked ( & their images)
    var questions = [];
    var images = [];
    if ( "questions" in info  ) {
        for (var j = Object.keys(info.questions).length - 1; j >= 0; j--) {
            var q = Object.values(info.questions);
            questions.push( q[j].question );
            images.push( q[j].media );
        }
    }

    if (questions.length == 0) {
        questions[0] = "No questions asked yet!";
    }

    // create a link to the form for each question, include the image
    var questionsLink = "";
    for (var k =0; k < questions.length; k++ ) {
        if ( questions[0] == "No questions asked yet!") {
            questionsLink +=
            "<tr><td> " +
            questions[0] +
            "<span style='width:50px; height: 1px; display: inline-block'></span>" +
            "</td></tr>";
            continue;
        }

        if (images[k] != "") {
            questionsLink +=
                "<tr><td>" +
                "<a href='form.html' target='_blank'>- " +
                questions[k]
                + "</a>" +
                "<span style='width:50px; height: 1px; display: inline-block'></span>" +
                "<a href=" + images[k] + " target='_blank'>" +
                "<image style='height: 150px' src=' " + images[k] + " '/>" +
                "</a>" +
                "</td></tr>";
        } else {
            questionsLink +=
                "<tr><td>" +
                "<a href='form.html?fromNum=" + phone + "' target='_blank'>- " + questions[k] + "</a>" +
                "</td></tr>";
        }
    }

    // append all the information to a card for the person
    var raw = document.createElement('div');
    raw.innerHTML =
        "<div class=\"card\">" +
        "<button type=\"button\" class=\"btn patientpage\" data-toggle=\"modal\" data-target=\"#" + info.first_name + "\">" +
        "<h1>" + info.first_name + " " + info.last_name + " " +
        "<span class=\"date\">" + info.months_along + " Months </span>" +
        "<span class=\"glyphicon glyphicon-calendar date\" aria-hidden=\"true\"> " +
        "</h1>" +
        "</button></div>" +
        "<br>"+
        "<div class=\"modal fade\" tabinde  x=\"-1\" role=\"dialog\" aria-labelledby=\"mySmallModalLabel\" aria-hidden=\"true\" id=\""+info.first_name+"\">" +
        "<div class=\"modal-dialog modal-lg\">" +
        "<div class=\"modal-content\">" +
        "<div class=\"card info\">" +
        "<h1>Patient Info</h1>" +
        "<br>"+
        "<table>" +
        "<tr width=\"100%\">" +
        "<td width=\"10%\">" +
        "<span class=\"field\">Name:</span>" +
        "</td>" +
        "<td width=\"40%\">" +
        "<span>" + info.first_name + " " + info.last_name + "</span><" +
        "/td>" +
        "<td width=\"10%\">" +
        "<span class=\"field\">Age:</span>" +
        "</td><td width=\"40%\">" +
        "<span>"+info.age +"</span>" +
        "</td>" +
        "</tr>" +
        "<tr>" +
        "<td>" +
        "<span class=\"field\">Location:</span>" +
        "</td>" +
        "<td>" +
        "<span>" + info.location + "</span>" +
        "</td>" +
        "<td>" +
        "<span class=\"field\">Phone:</span>" +
        "</td>" +
        "<td>" +
        "<span>"+phone+"</span>" +
        "</td>" +
        "</tr>" +
        "</table>"+
        "<br>" +
        "<table>" +
        "<tr width=\"100%\">" +
        "<td>" +
        "<span class=\"field\">Timeline of questions (newest to oldest):</span>" +
        "</td>" +
        "</tr>" +
        questionsLink +
        "</table>" +
        "</div></div></div></div>";
    document.getElementById("Items").appendChild(raw);
}