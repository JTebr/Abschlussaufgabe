/**
 * @desc creating the webmap
 * @author Jan Tebrügge
 */
"use strict";
var map, layercontrol, editableLayers, visualizationLayers, drawControl, routeControl, routeSwitch, currentRoute;

//creating the map
var map = L.map('map').setView([51.95, 7.61], 11);
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets'
}).addTo(map);

map.locate({
    setView: true,
    maxZoom: 16
});

// Setup Routing Plugin
routeControl = L.Routing.control({
  waypoints: [
      null
  ],
  routeWhileDragging: true,
  show:true,
  position: 'topright',
  geocoder: L.Control.Geocoder.nominatim()
}).addTo(map);

// Code taken from http://www.liedman.net/leaflet-routing-machine/tutorials/interaction/
map.on('click', function(e) {
  if (routeSwitch){
    var container = L.DomUtil.create('div'),
        startBtn = createButton('Start from this location', container),
        destBtn = createButton('Go to this location', container);

    L.popup()
        .setContent(container)
        .setLatLng(e.latlng)
        .openOn(map);
    L.DomEvent.on(startBtn, 'click', function() {
    routeControl.spliceWaypoints(0, 1, e.latlng);
    map.closePopup();
    });
    L.DomEvent.on(destBtn, 'click', function() {
      routeControl.spliceWaypoints(routeControl.getWaypoints().length - 1, 1, e.latlng);
      map.closePopup();
    });
  }
});

routeControl.on('routeselected', function(e) {
    currentRoute = {};
    currentRoute.waypoints = routeControl.getWaypoints();
    currentRoute.route = e.route;

})

// setup Leaflet.draw plugin
// layer to draw on
editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);
// Leaflet.draw options
var options = {
    position: 'bottomright',
    edit: {
        featureGroup: editableLayers, //REQUIRED!!
        remove: false
    }
};
  // setup Leaflet.draw plugin
// layer to draw on
visualizationLayers = new L.FeatureGroup();
map.addLayer(visualizationLayers);

// add controls to map
drawControl = new L.Control.Draw(options);

map.addControl(drawControl);
// when drawing is done, save drawn objects to the drawing layer
map.on(L.Draw.Event.CREATED, function (e) {
  var type = e.layerType,
      layer = e.layer;
  editableLayers.addLayer(layer);
});
map.on(L.Draw.Event.DRAWSTART, function (e) {
    map.closePopup();
    routeSwitch = false;
});
map.on(L.Draw.Event.DRAWSTOP, function (e) {
    routeSwitch = true;
});

/**
 * @see http://leaflet.github.io/Leaflet.draw/docs/leaflet-draw-latest.html
 * @desc Adding the edit toolbar
 */

// FeatureGroup is to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    }
});
map.addControl(drawControl);

var json;

/**
 * @desc function to draw on the map
 */
map.on(L.Draw.Event.CREATED, function(e) {
    var type = e.layerType,
        layer = e.layer;
    json = layer.toGeoJSON();
    map.addLayer(layer);
});

/**
 * @see https://github.com/eligrey/FileSaver.js/wiki/FileSaver.js-Example
 * @desc saves a file using FileSaver.js
 */
function SaveAsFile(t, f, m) {
    try {
        var b = new Blob([t], {
            type: m
        });
        saveAs(b, f);
    } catch (e) {
        window.open("data:" + m + "," + encodeURIComponent(t), '_blank', '');
    }
}


/**
 * saves a drawn layer as a geojson file.
 */
function SaveGeoJSON() {
    // creates a String from the geojson object.
    var jsonString = JSON.stringify(json);
    var filename = document.getElementById("geojsonName").value + ".txt";

    SaveAsFile(jsonString, filename, "text/plain;charset=utf-8");
}

/**
 * function which assigns the value of the hidden field the drawn geometry from the map (GeoJSON)
 */
function StringGeoJSON() {

    console.log(JSON.stringify(json));
    document.getElementById("inputGeoObject").value = JSON.stringify(json); // creates a String from the geojson object

}

/**
 * function to add the geometry from the database to the map
 */
function JSON2Map(geo){

    console.log(geo);
    L.geoJSON(geo).addTo(map);

}

/**
 * function to be executed if a location is available.
 */
function onLocationFound(e) {
    var radius = e.accuracy / 2;

    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();

    L.circle(e.latlng, radius).addTo(map);
}

map.on('locationfound', onLocationFound);

/**
 * function to be executed if the location fails
 */
function onLocationError(e) {
    alert(e.message);
}

map.on('locationerror', onLocationError);

// creating a permanent marker with popup and picture
var popupcont = {
    "Domplatz": "Here is the Domplatz of Münster: <img src= images/Domplatz.jpg height=200 width= 200>"
}
var marker = L.marker([51.962518, 7.625911]).addTo(map);
marker.bindPopup(popupcont["Domplatz"]).openPopup();

/**
 * @desc ajax function for form's action
 * @see https://stackoverflow.com/questions/10041496/how-to-use-jquery-ajax-to-my-forms-action
 */
$('form').on('submit',function(e){
    e.preventDefault();
    console.log('Sending request to '+$(this).attr('action')+' with data: '+$(this).serialize());
    $.ajax({
        type     : "POST",
        cache    : false,
        url      : $(this).attr('action'),
        data     : $(this).serialize(),
        success  : function(data) {
            $(".printArea").empty().append(data).css('visibility','visible');
        }
});

});
