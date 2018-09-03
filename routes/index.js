/**
*
* Source: https://closebrace.com/tutorials/2017-03-02/the-dead-simple-step-by-step-guide-for-front-end-developers-to-getting-up-and-running-with-nodejs-express-and-mongodb
*/

"use strict";

var express = require('express'); //Express functionality
var router = express.Router(); //attaching a router variable to Express's router method

/* GET home / index */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// /* GET Karte. */
router.get('/karte', function(req, res) {
    res.render('karte', { title: 'Geosoftware I - Exercise 5' });
});

// /* GET Impressum. */
router.get('/impressum', function(req, res) {
    res.render('impressum', { title: 'Geosoftware I - Exercise 5' });
});

/* POST to Add Geo Service */
router.post('/addgeo', function(req, res) {

    // Set our internal DB variable
    var db = req.db;

    // Get our form values.
    var filename = req.body.filename;
    var value =  req.body.geo;
    console.log(req.body);

    // Set our collection
    var collection = db.get('geocollection');

    // Submit to the DB
    collection.insert({
        "filename" : filename,
        "geo" : value
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the file to the database.");
        }
        else {
            // And forward to success page
            res.redirect("karte");
        }
    });

});

/* GET geolist page. */
// extracting db object which is passed to the http request
// using that db connection to fill the docs variable with database documents
// page render
router.get('/geolist', function(req, res) {
    var db = req.db;
    var collection = db.get('geocollection');// tells the app which collection should be used
    collection.find({},{},function(e,docs){// do a find
        console.log(docs);
        res.render('geolist', {// render of geolist, giving it the userlist variable to work with
            "geolist" : docs// passing the database documents to that variable
        });
    });
});

// export router function back to app
module.exports = router;
