#Leaflet MaskCanvas

A leaflet canvas layer for displaying large coverage data sets.

__Features__:

* Canvas tile layer based
* High performance even for large dataset because of the [QuadTree](https://en.wikipedia.org/wiki/Quadtree) that is used internally
* Custom color and circle size

## Demo

Not yet available.

##Usage

### Set up

* Add the MaskCanvas and Quadtree libraries.

```html
<script src="QuadTree.js"></script>
<script src="L.TileLayer.MaskCanvas.js"></script>
```

* Initialize the maskCanvas layer

```javascript
L.TileLayer.maskCanvas();
```

* Set the dataset for the layer.

```javascript
layer.setData(data);
```

* Finally add the layer to the map.

```javascript
map.addLayer(layer);
```

The data format is a simple array of `[lat, lng]` pairs.

For example `[[51.503076,-0.280115],[51.51412,-0.075334],[51.5154,-0.072642],[51.54072,-0.299246]]`. I recommend that you load the data set asynchronously in order to keep the page responsive. Once the data is loaded, you can add it to the layer and display it.

### Possible options

The MaskCanvas layer supports all [Leaflet canvas layer options](http://leafletjs.com/reference.html#tilelayer-options) which can be passed to `L.TileLayer.maskCanvas`. You probably want to set the layer opacity.

Other possible options:

```javascript
var layer = L.TileLayer.maskCanvas({
       radius: 5,  // radius of a masked circle around a data point
       color: '#000'  // the color of the layer
});
```

## Screenshot

![screenshot](https://raw.github.com/domoritz/leaflet-maskcanvas/master/screenshot.png "Screenshot showing mask canvas layer")

## Acknowledgement

The QuadTree implementation comes from https://github.com/jsmarkus/ExamplesByMesh/tree/master/JavaScript/QuadTree and has been slightly modified. Original Implementation by Mike Chambers.
