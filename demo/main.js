$(function() {
    //============
    // Base Layers

    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {
            attribution: osmAttrib
    });

    map = new L.Map('map', {
        center: new L.LatLng(52.51538, 13.40997),
        zoom: 8,
        layers: [osm]
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