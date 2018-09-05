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
 * load external GeoJSON file via Ajax (Caution! Server to load from has to allow cross origin requests!)
 */
function showExternalFile() {
    $.get(document.getElementById('externalfile').value, function(response) {
        L.geoJSON(JSON.parse(response)).addTo(map);
    });
}

/**
 * provide the objects drawn using the Leaflet.draw plugin as a GeoJSON to download
 */
function exportDrawing() {
    // fake a link
    var anchor = document.createElement('a');
    // encode geojson as the link's contents
    anchor.href = 'data:application/vnd.geo+json,' + encodeURIComponent(JSON.stringify(editableLayers.toGeoJSON()));
    anchor.target = '_blank';
    // give it a nice file name
    anchor.download = "your-drawing.geojson";
    // add to document (Firefox needs that)
    document.body.appendChild(anchor);
    // fake a click on the link -> file will be offered for download
    anchor.click();
    // remove that element again as if nothing happened
    document.body.removeChild(anchor);
}

/**
 * add resizing capability (curtesy of several StackExchange users)
 */
function initUI() {
    var resize= $("#content");
    var containerWidth = $("body").width();

    $(resize).resizable({
        handles: 'e',
        /*maxWidth: 450,
        minWidth: 120,*/
        classes: { "ui-resizable-handle": "hidden-xs hidden-sm" },
        resize: function(event, ui){
            var currentWidth = ui.size.width;

            // this accounts for padding in the panels +
            // borders, you could calculate this using jQuery
            var padding = 12;

            // this accounts for some lag in the ui.size value, if you take this away
            // you'll get some instable behaviour
            $(this).width(containerWidth - currentWidth - padding);

            // set the content panel width
            $("#content").width(currentWidth);
        }
    });
}

// Overwrite HTML Form handlers once document is created.
$(document).ready(function() {

    // overwrite submit handler for form used to save to Database
    $('#saveFormGeo').submit(function(e) {
        e.preventDefault();
        // Append hidden field with actual GeoJSON structure
        var inputGeo = $('<input type="hidden" name="geometry" value=' + JSON.stringify(editableLayers.toGeoJSON())+ '>');
        $(this).append(inputGeo);
        var that = this;
        // submit via ajax
        $.ajax({
            data: $(that).serialize(),
            type: $(that).attr('method'),
            url:  $(that).attr('action'),
            error: function(xhr, status, err) {
                console.log("Error while saving Geometry to Database");
                alert("Error while saving Geometry to Database");
            },
            success: function(res) {
                console.log("Geometry with the name '" + that.elements.name.value + "' saved to Database.");
            }
        });
        inputGeo.remove();
        return false;
    });
    // submit handler for forms used to load from Database
    $('#loadFormGeo').submit(function(e) {
        // Prevent default html form handling
        e.preventDefault();

        var that = this;

        // submit via ajax
        $.ajax({
            // catch custom response code.
            statusCode: {
                404: function() {
                    alert("Geometry with the name '" + that.elements.loadname.value + "' is not present in the Database.");
                }
            },
            data: '',
            type: $(that).attr('method'),
            // Dynamically create Request URL by appending requested name to /api prefix
            url:  $(that).attr('action') + that.elements.loadname.value,
            error: function(xhr, status, err) {
            },
            success: function(res) {
                console.log("success");
                // Add Geometry to Map
                L.geoJSON(JSON.parse(res[0].geometry)).addTo(map);
                alert("Geometry '" + that.elements.loadname.value + "' successfully loaded.");
            }
        });
        return false;
    });
    // overwrite submit handler for form used to save to Database
    $('#saveFormRoutes').submit(function(e) {
        e.preventDefault();
        if (currentRoute){
            // Append hidden field with actual GeoJSON structure
            var inputRoute = $("<input type='hidden' name='route' value='" + JSON.stringify(currentRoute) + "'>");
            $(this).append(inputRoute);
            var that = this;

            // submit via ajax
            $.ajax({
                data: $(that).serialize(),
                type: $(that).attr('method'),
                url:  $(that).attr('action'),
                error: function(xhr, status, err) {
                    console.log("Error while saving Route to Database");
                },
                success: function(res) {
                    console.log("Route with the name '" + that.elements.name.value + "' saved to Database.");
                }
            });
            inputRoute.remove();
            return false;
        }
    });
    // submit handler for forms used to load from Database
    $('#loadFormRoutes').submit(function(e) {
        // Prevent default html form handling
        e.preventDefault();
        var that = this;

        // submit via ajax
        $.ajax({
            // catch custom response code.
            statusCode: {
                404: function() {
                    alert("Route with the name '" + that.elements.loadname.value + "' is not present in the Database.");
                }
            },
            data: '',
            type: $(that).attr('method'),
            // Dynamically create Request URL by appending requested name to /api prefix
            url:  $(that).attr('action') + that.elements.loadname.value,
            error: function(xhr, status, err) {
            },
            success: function(res) {
                var route = JSON.parse(res[0].route);
                routeControl.setWaypoints(route.waypoints).addTo(map);
                console.log("Route '" + that.elements.loadname.value + "' successfully loaded.");
            }
        });
        return false;
    });

    // submit handler for forms used to load from Database
    $('#loadFormRoutesVisualization').submit(function(e) {
        // Prevent default html form handling
        e.preventDefault();
        var that = this;

        // submit via ajax
        $.ajax({
            // catch custom response code.
            statusCode: {
                404: function() {
                    alert("Route with the name '" + that.elements.loadname.value + "' is not present in the Database.");
                }
            },
            data: '',
            type: $(that).attr('method'),
            // Dynamically create Request URL by appending requested name to /api prefix
            url:  $(that).attr('action') + that.elements.loadname.value,
            error: function(xhr, status, err) {
            },
            success: function(res) {
                var route = JSON.parse(res[0].route);
                console.log(res[0].route);
                L.geoJSON(RouteToGeoJSON(route.route)).addTo(visualizationLayers);
                console.log("Route '" + that.elements.loadname.value + "' successfully visualized.");
            }
        });
        return false;
    });

    if ((document.getElementById('loadname')).value != ""){
        document.getElementById('loadRoutes').click();
    }
});


// Credit to https://github.com/perliedman/leaflet-routing-machine/blob/344ff09c8bb94d4e42fa583286d95396d8227c65/src/L.Routing.js
function RouteToGeoJSON(route){
    var wpNames = [],
        wpCoordinates = [],
        i,
        wp,
        latLng;

    for (i = 0; i < route.waypoints.length; i++) {
        wp = route.waypoints[i];
        latLng = L.latLng(wp.latLng);
        wpNames.push(wp.name);
        wpCoordinates.push([latLng.lng, latLng.lat]);
    }
    return {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {
                    id: 'waypoints',
                    names: wpNames
                },
                geometry: {
                    type: 'MultiPoint',
                    coordinates: wpCoordinates
                }
            },
            {
                type: 'Feature',
                properties: {
                    id: 'line',
                },
                geometry: routeToLineString(route)
            }
        ]
    };
}

// Credits to https://github.com/perliedman/leaflet-routing-machine/blob/344ff09c8bb94d4e42fa583286d95396d8227c65/src/L.Routing.js
function routeToLineString(route) {
    var lineCoordinates = [],
        i,
        latLng;

    for (i = 0; i < route.coordinates.length; i++) {
        latLng = L.latLng(route.coordinates[i]);
        lineCoordinates.push([latLng.lng, latLng.lat]);
    }

    return {
        type: 'LineString',
        coordinates: lineCoordinates
    };
}


// Code taken from http://www.liedman.net/leaflet-routing-machine/tutorials/interaction/
function createButton(label, container) {
    var btn = L.DomUtil.create('button', '', container);
    btn.setAttribute('type', 'button');
    btn.innerHTML = label;
    return btn;
}
function clearVisualizationLayer() {
    visualizationLayers.clearLayers();
}

document.addEventListener("DOMContentLoaded", function(event) {
    initMap();
    initUI();
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
