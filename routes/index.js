/**
*
* Source: https://closebrace.com/tutorials/2017-03-02/the-dead-simple-step-by-step-guide-for-front-end-developers-to-getting-up-and-running-with-nodejs-express-and-mongodb
*/

"use strict";

var express = require('express'); //Express functionality
var router = express.Router(); //attaching a router variable to Express's router method
var monk = require('monk');
var db = monk('localhost:27017/Abschlussaufgabe');
/* GET home / index */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// /* GET Karte. */
router.get('/karte', function(req, res) {
    res.render('karte', { title: 'Geosoftware I - Abschlussaufgabe' });
});

// /* GET Impressum. */
router.get('/impressum', function(req, res) {
    res.render('impressum', { title: 'Geosoftware I - Abschlussaufgabe' });
});


/* POST to Add Geo Service *
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

/* GET geolist page. *
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
/* POST Geojson to be saved to database. */
router.post('/save/geometry/', function(req, res, next) {

    // Set collection
    var jsoncollection = db.get('jsoncollection');

    // Submit to the DB
    jsoncollection.insert({
        "name" : req.body.name,
        "geometry" : req.body.geometry
    }, function (err, doc) {
        if (err) {
            res.status(500).end("Failed to write Geometry to Database");
        }
        else {
            res.status(200).end("Successfully written Geometry to Database.");
        }
    });
});

/* GET stored Geometry */
router.get('/load/geometry/:name/', function(req, res, next) {

    // Set Collection
    var collection = db.get('jsoncollection');

    // Retrieve Entries with matching Name from Database. Compelete Entry is returned on match.
    collection.find({name: { $eq: req.params.name }},{},function(e,geometry){
        // Check for connection/syntax errors
        if(e){
            res.status(500).end("Failed to retrieve results from Database.");
        }else{
            // Check if there is an Entry - else fail
            if(geometry.length != 0){
                // Entry is returned
                res.send(geometry);
            } else {
                // No entry was found
                res.status(404).end("No such Object in the Database.");
            }
        };
    });
});

/* POST Geojson to be saved to database. */
router.post('/save/route/', function(req, res, next) {

    // Set collection
    var jsoncollection = db.get('jsoncollection');

    // Submit to the DB
    jsoncollection.insert({
        "routename" : req.body.nameroute,
        "route" : req.body.route
    }, function (err, doc) {
        if (err) {
            res.status(500).end("Failed to write Route to Database");
        }
        else {
            res.status(200).end("Successfully written Route to Database.");
        }
    });
});

/* GET stored Route */
router.get('/load/route/:name/', function(req, res, next) {

    // Set Collection
    var collection = db.get('jsoncollection');

    // Retrieve Entries with matching Name from Database. Compelete Entry is returned on match.
    collection.find({routename: { $eq: req.params.name }},{},function(e,route){
        // Check for connection/syntax errors
        if(e){
            res.status(500).end("Failed to retrieve results from Database.");
        }else{
            // Check if there is an Entry - else fail
            if(route.length != 0){
                // Entry is returned
                res.send(route);
            } else {
                // No entry was found
                res.status(404).end("No such Object in the Database.");
            }
        };
    });
});
module.exports = router;
