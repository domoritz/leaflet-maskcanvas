$(function() {
    //============
    // Base Layers

    var cloudmadeAttribution =  'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>';

    var layer_CloudMate = new L.tileLayer(
        'http://{s}.tile.cloudmade.com/63250e2ef1c24cc18761c70e76253f75/997/256/{z}/{x}/{y}.png',{
            attribution: cloudmadeAttribution,
            maxZoom: 18
        }
    );

    map = new L.Map('map', {
        center: new L.LatLng(52.51538, 13.40997),
        zoom: 8,
        layers: [layer_CloudMate]
    });

    L.control.scale().addTo(map);

    //================
    // Set up overlays

    var initRadius = 800;
    $('input.range').attr('value', initRadius);

    var coverageLayer = new L.TileLayer.MaskCanvas({'opacity': 0.5, radius: initRadius, useAbsoluteRadius: true, 'attribution': 'VBB stations from <a href="//daten.berlin.de/datensaetze/vbb-fahrplan2012">daten.berlin.de</a>'});

    var loadOverlay = function(id) {
        var url = id + '.json';
        $.getJSON(url).success(function(data) {
            coverageLayer.setData(data);
            map.fitBounds(coverageLayer.bounds);
            map.addLayer(coverageLayer);
        }).error(function(err) {
            alert('An error occurred', err);
        });
    };

    loadOverlay('VBB');
});