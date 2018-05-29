# Leaflet MaskCanvas

A leaflet canvas layer for displaying large coverage data sets.

__Features__:

* Canvas tile layer based
* High performance even for large dataset because of the [QuadTree](https://en.wikipedia.org/wiki/Quadtree) that is used internally
* Custom color and circle size

## Demo

Check out the demo at http://domoritz.github.com/vbb-coverage/.

## Usage

### Set up

* Add the MaskCanvas and Quadtree libraries.

```html
<script src="QuadTree.js"></script>
<script src="L.TileLayer.MaskCanvas.js"></script>
```

You can also use the following package managers

* [npm](https://www.npmjs.com/) `npm install leaflet.maskcanvas`
* [bower](http://bower.io/) `bower install leaflet.maskcanvas`

#### Initialize the maskCanvas layer

```javascript
L.TileLayer.maskCanvas();
```

#### Set the dataset for the layer.

```javascript
layer.setData(data);
```

#### Finally add the layer to the map.

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
       opacity: 0.5,  // opacity of the not covered area
       noMask: false,  // true results in normal (filled) circled, instead masked circles
       lineColor: '#A00'   // color of the circle outline if noMask is true
});
```

## Leaflet 1.0

For the upcoming leaflet version there is a slightly changed implementation based on L.GridLayer.
All you need to do, is replace `L.TileLayer.maskCanvas` with `L.GridLayer.maskCanvas`.

The new `L.GridLayer.maskCanvas` for leaflet 1.0 supports the same options as before.
Additionally it allows you to specify different radii for each data point
as you can see in the example at http://loggia.at/leaflet-maskcanvas/demo/index-1.0-dev.html

## Screenshot

![screenshot](https://raw.github.com/domoritz/leaflet-maskcanvas/master/screenshot.png "Screenshot showing mask canvas layer")

## Developers

Run the demo locally with `python -m SimpleHTTPServer` and then open http://0.0.0.0:8000/demo.

## Acknowledgement

The QuadTree implementation comes from https://github.com/jsmarkus/ExamplesByMesh/tree/master/JavaScript/QuadTree and has been slightly modified. Original Implementation by Mike Chambers.
