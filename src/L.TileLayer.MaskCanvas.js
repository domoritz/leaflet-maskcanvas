/**
 * This implementation is based on https://github.com/domoritz/leaflet-maskcanvas
 * It is compatible with leaflet >= 0.8-dev
 */
L.TileLayer.MaskCanvas = L.TileLayer.extend({
  options: {
    radius: 5,
    useAbsoluteRadius: true,  // true: radius in meters, false: radius in pixels
    color: '#000',
    opacity: 0.5,
    noMask: false,  // true results in normal (filled) circled, instead masked circles
    lineColor: undefined,  // color of the circle outline if noMask is true
    debug: false
  },

  initialize: function (options) {
    L.Util.setOptions(this, options);
  },

  /**
   * Called by leaflet-0.8
   *
   * @param {L.Point} coords
   * @returns {HTMLCanvasElement}
   */
  createTile: function (coords) {
    var canvas = this._createCanvas();

    if (this.options.debug) {
      this._drawDebugInfo(canvas, coords);
    }
    this._draw(canvas, coords);

    return canvas;
  },

  /**
   * @returns {HTMLCanvasElement}
   * @private
   */
  _createCanvas: function() {
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = this.options.tileSize;
    return canvas;
  },

  _drawDebugInfo: function (canvas, coords) {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 255, 255);

    ctx.fillStyle = 'black';
    ctx.fillText('x: ' + coords.x + ', y: ' + coords.y + ', zoom: ' + coords.z, 20, 20);

    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(255, 0);
    ctx.lineTo(255, 255);
    ctx.lineTo(0, 255);
    ctx.closePath();
    ctx.stroke();
  },

  /**
   *
   * @param {[number, number]} dataset
   */
  setData: function (dataset) {
    this.bounds = new L.LatLngBounds(dataset);

    this._quad = new QuadTree(this._boundsToQuery(this.bounds), false, 6, 6);

    var first = dataset[0];
    var xc = 1, yc = 0;
    if (first instanceof L.LatLng) {
      xc = "lng";
      yc = "lat";
    }

    for (var index in dataset) {
      if (dataset.hasOwnProperty(index)) {
        this._quad.insert({
          x: dataset[index][xc], //lng
          y: dataset[index][yc] //lat
        });
      }
    }

    if (this._map) {
      this.redraw();
    }
  },

  setRadius: function (radius) {
    this.options.radius = radius;
    this.redraw();
  },

  _tilePoint: function (coords, pointCoords) {
    // start coords to tile 'space'
    var s = coords.multiplyBy(this.options.tileSize);

    // actual coords to tile 'space'
    var p = this._map.project(new L.LatLng(pointCoords.y, pointCoords.x));

    // point to draw
    var x = Math.round(p.x - s.x);
    var y = Math.round(p.y - s.y);
    return [x, y];
  },

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {L.Point} coords
   * @param pointCoordinates
   * @private
   */
  _drawPoints: function (canvas, coords, pointCoordinates) {
    var p,
        tileSize = this.options.tileSize,
        ctx = canvas.getContext('2d');
    ctx.fillStyle = this.options.color;

    if (this.options.lineColor) {
      ctx.strokeStyle = this.options.lineColor;
      ctx.lineWidth = this.options.lineWidth || 1;
    }
    ctx.globalCompositeOperation = 'source-over';
    if (!this.options.noMask && !this.options.debug) { // avoid overwriting debug
      ctx.fillRect(0, 0, tileSize, tileSize);
      ctx.globalCompositeOperation = 'destination-out';
    }
    for (var index in pointCoordinates) {
      if (pointCoordinates.hasOwnProperty(index)) {
        p = this._tilePoint(coords, pointCoordinates[index]);
        ctx.beginPath();

        ctx.arc(p[0], p[1], this._getRadius(), 0, Math.PI * 2);
        ctx.fill();
        if (this.options.lineColor) {
          ctx.stroke();
        }
      }
    }
  },

  _boundsToQuery: function (bounds) {
    if (bounds.getSouthWest() == undefined) {
      return {x: 0, y: 0, width: 0.1, height: 0.1};
    }  // for empty data sets
    return {
      x: bounds.getSouthWest().lng,
      y: bounds.getSouthWest().lat,
      width: bounds.getNorthEast().lng - bounds.getSouthWest().lng,
      height: bounds.getNorthEast().lat - bounds.getSouthWest().lat
    };
  },

  _getLatRadius: function () {
    return (this.options.radius / 40075017) * 360;
  },

  _getLngRadius: function () {
    return this._getLatRadius() / Math.cos(Math.PI / 180 * this._latlng.lat);
  },

  /**
   * call to update the radius
   */
  projectLatlngs: function () {
    var lngRadius = this._getLngRadius(),
        latlng2 = new L.LatLng(this._latlng.lat, this._latlng.lng - lngRadius, true),
        point2 = this._map.latLngToLayerPoint(latlng2),
        point = this._map.latLngToLayerPoint(this._latlng);
    this._radius = Math.max(Math.round(point.x - point2.x), 1);
  },

  /**
   * The radius of a circle can be either absolute in pixels or in meters.
   *
   * @returns {number}
   * @private
   */
  _getRadius: function () {
    if (this.options.useAbsoluteRadius) {
      return this._radius;
    } else {
      return this.options.radius;
    }
  },

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {L.Point} coords
   * @private
   */
  _draw: function (canvas, coords) {
    if (!this._quad || !this._map) {
      return;
    }

    var tileSize = this.options.tileSize;

    var nwPoint = coords.multiplyBy(tileSize);
    var sePoint = nwPoint.add(new L.Point(tileSize, tileSize));

    if (this.options.useAbsoluteRadius) {
      var centerPoint = nwPoint.add(new L.Point(tileSize / 2, tileSize / 2));
      this._latlng = this._map.unproject(centerPoint);
      this.projectLatlngs();
    }

    // padding
    var pad = new L.Point(this._getRadius(), this._getRadius());
    nwPoint = nwPoint.subtract(pad);
    sePoint = sePoint.add(pad);

    var bounds = new L.LatLngBounds(this._map.unproject(sePoint), this._map.unproject(nwPoint));

    var pointCoordinates = this._quad.retrieveInBounds(this._boundsToQuery(bounds));

    this._drawPoints(canvas, coords, pointCoordinates);
  }
});

L.TileLayer.maskCanvas = function (options) {
  return new L.TileLayer.MaskCanvas(options);
};
