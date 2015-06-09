$(function() {
  //============
  // Base Layers

  var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  var osmAttrib='Map data © <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';
  var osm = new L.TileLayer(osmUrl, {
    attribution: osmAttrib
  });

  var map = new L.Map('map', {
    center: new L.LatLng(48.210033, 16.363449),
    zoom: 15,
    layers: [osm]
  });

  L.control.scale().addTo(map);

  //================
  // Set up overlays

  var coverageLayer = new L.GridLayer.MaskCanvas({
    opacity: 0.5,
    radius: 70,
    useAbsoluteRadius: true
  });
  coverageLayer.setData([
    [48.21033, 16.3614, 80],  // Burgtheather
    [48.21086, 16.3573, 110], // Rathaus
    [48.2085, 16.3732],       // Stephansdom (uses default radius of 70)
    [48.2081, 16.3584, 100],  // Parlament
    [48.19832, 16.37185, 42], // Karlskirche
    [48.20332, 16.36909, 80]  // Staatsoper
  ]);

  map.addLayer(coverageLayer);
  map.fitBounds(coverageLayer.bounds);
});