#Leaflet MaskCanvas

A leaflet canvas layer for displaying large coverage data sets.

__Features__:

* Canvas tile layer based
* High performance even for large dataset because of the [QuadTree](https://en.wikipedia.org/wiki/Quadtree) that is used internally
* Custom color and circle size

## Demo

Check out the demo at http://domoritz.github.com/vbb-coverage/.

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

The data format is a simple array of `[lat, lng]` pairs. For example `[[51.50,-0.28],[51.51,-0.07],[51.51,-0.07],[51.54,-0.29]]`. I recommend that you load the data set asynchronously in order to keep the page responsive. Once the data is loaded, you can add it to the layer and display it.

### Possible options

The MaskCanvas layer supports all [Leaflet canvas layer options](http://leafletjs.com/reference.html#tilelayer-options) which can be passed to `L.TileLayer.maskCanvas`. You probably want to set the layer opacity.

Other possible options:

```javascript
var layer = L.TileLayer.maskCanvas({
       radius: 5,  // radius in pixels or in meters (see useAbsoluteRadius)
       useAbsoluteRadius: true,  // true: r in meters, false: r in pixels
       color: '#000',  // the color of the layer
       opacity: 0.5,  // opacity of the not coverted area
});
```

## Screenshot

![screenshot](https://raw.github.com/domoritz/leaflet-maskcanvas/master/screenshot.png "Screenshot showing mask canvas layer")

## Acknowledgement

The QuadTree implementation comes from https://github.com/jsmarkus/ExamplesByMesh/tree/master/JavaScript/QuadTree and has been slightly modified. Original Implementation by Mike Chambers.
