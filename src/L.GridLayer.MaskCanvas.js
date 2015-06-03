/**
 * This L.GridLayer.MaskCanvas plugin is for Leaflet 1.0
 * For Leaflet 0.7.x, please use L.TileLayer.MaskCanvas
 */
L.GridLayer.MaskCanvas = L.GridLayer.extend({
  options: {
    radius: 5,
    useAbsoluteRadius: true,  // true: radius in meters, false: radius in pixels
    color: '#000',
    opacity: 0.5,
    noMask: false,  // true results in normal (filled) circled, instead masked circles
    lineColor: undefined,  // color of the circle outline if noMask is true
    debug: false,
    zIndex: 18 // if it is lower, then the layer is not in front
  },

  initialize: function (options) {
    L.setOptions(this, options);
  },

  createTile: function (coords) {
    var tile = document.createElement('canvas');
    tile.width = tile.height = this.options.tileSize;

    this._draw(tile, coords);

    if (this.options.debug) {
      this._drawDebugInfo(tile, coords);
    }

    return tile;
  },

  _drawDebugInfo: function (canvas, coords) {
    var tileSize = this.options.tileSize;
    var ctx = canvas.getContext('2d');

    ctx.globalCompositeOperation = 'xor';

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, tileSize, tileSize);

    ctx.strokeStyle = '#000';
    ctx.strokeText('x: ' + coords.x + ', y: ' + coords.y + ', zoom: ' + coords.z, 20, 20);

    ctx.strokeStyle = '#f55';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tileSize, 0);
    ctx.lineTo(tileSize, tileSize);
    ctx.lineTo(0, tileSize);
    ctx.closePath();
    ctx.stroke();
  },

  /**
   * Pass either pairs of (y,x) or (y,x,radius) coordinates.
   * Alternatively you can also pass LatLng objects.
   *
   * @param {[[number, number]]|[[number, number, number]]|[L.LatLng]} dataset
   */
  setData: function (dataset) {
    var self = this;
    this.bounds = new L.LatLngBounds(dataset);

    this._quad = new QuadTree(this._boundsToQuery(this.bounds), false, 6, 6);

    var first = dataset[0];
    var xc = 1, yc = 0;
    if (first instanceof L.LatLng) {
      xc = "lng";
      yc = "lat";
    }

    dataset.forEach(function(d) {
      self._quad.insert({
        x: d[xc], //lng
        y: d[yc] //lat
      });
    });

    if (this._map) {
      this.redraw();
    }
  },

  setRadius: function(radius) {
    this.options.radius = radius;
    this.redraw();
  },

  /**
   * @param {L.Point} coords
   * @param {L.Point} pointCoordinate
   * @returns {[number, number]}
   * @private
   */
  _tilePoint: function (coords, pointCoordinate) {
    // start coords to tile 'space'
    var s = coords.multiplyBy(this.options.tileSize);

    // actual coords to tile 'space'
    var p = this._map.project(new L.LatLng(pointCoordinate.y, pointCoordinate.x), coords.z);

    // point to draw
    var x = Math.round(p.x - s.x);
    var y = Math.round(p.y - s.y);
    return [x, y];
  },

  _boundsToQuery: function(bounds) {
    if (bounds.getSouthWest() == undefined) { return {x: 0, y: 0, width: 0.1, height: 0.1}; }  // for empty data sets
    return {
      x: bounds.getSouthWest().lng,
      y: bounds.getSouthWest().lat,
      width: bounds.getNorthEast().lng-bounds.getSouthWest().lng,
      height: bounds.getNorthEast().lat-bounds.getSouthWest().lat
    };
  },

  _getLatRadius: function () {
    return (this.options.radius / 40075017) * 360;
  },

  _getLngRadius: function () {
    return this._getLatRadius() / Math.cos(Math.PI / 180 * this._latlng.lat);
  },

  // call to update the radius
  projectLatLngs: function (coords) {
    var lngRadius = this._getLngRadius(),
        latlng2 = new L.LatLng(this._latlng.lat, this._latlng.lng - lngRadius, true);

    var point2 = this._latLngToLayerPoint(latlng2, coords.z);

    var point = this._latLngToLayerPoint(this._latlng, coords.z);

    this._radius = Math.max(Math.round(point.x - point2.x), 1);
  },

  /**
   * This is used instead of this._map.latLngToLayerPoint
   * in order to use custom zoom value.
   *
   * @param {L.LatLng} latLng
   * @param {number} zoom
   * @returns {L.Point}
   * @private
   */
  _latLngToLayerPoint: function (latLng, zoom) {
    var point = this._map.project(latLng, zoom)._round();
    return point._subtract(this._map.getPixelOrigin());
  },

  // the radius of a circle can be either absolute in pixels or in meters
  _getRadius: function() {
    if (this.options.useAbsoluteRadius) {
      return this._radius;
    } else{
      return this.options.radius;
    }
  },

  /**
   * @param {HTMLCanvasElement|HTMLElement} canvas
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
      var centerPoint = nwPoint.add(new L.Point(tileSize/2, tileSize/2));
      this._latlng = this._map.unproject(centerPoint, coords.z);
      this.projectLatLngs(coords);
    }

    // padding
    var pad = new L.Point(this._getRadius(), this._getRadius());
    nwPoint = nwPoint.subtract(pad);
    sePoint = sePoint.add(pad);

    var bounds = new L.LatLngBounds(this._map.unproject(sePoint, coords.z), this._map.unproject(nwPoint, coords.z));

    var pointCoordinates = this._quad.retrieveInBounds(this._boundsToQuery(bounds));

    this._drawPoints(canvas, coords, pointCoordinates);
  },

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {L.Point} coords
   * @param {[L.Point]} pointCoordinates
   * @private
   */
  _drawPoints: function (canvas, coords, pointCoordinates) {
    var ctx = canvas.getContext('2d'),
        tilePoint;
    ctx.fillStyle = this.options.color;

    if (this.options.lineColor) {
      ctx.strokeStyle = this.options.lineColor;
      ctx.lineWidth = this.options.lineWidth || 1;
    }

    ctx.globalCompositeOperation = 'source-over';
    if (!this.options.noMask && !this.options.debug) {
      ctx.fillRect(0, 0, this.options.tileSize, this.options.tileSize);
      ctx.globalCompositeOperation = 'destination-out';
    }

    for (var index in pointCoordinates) {
      if (pointCoordinates.hasOwnProperty(index)) {
        tilePoint = this._tilePoint(coords, pointCoordinates[index]);
        ctx.beginPath();
        ctx.arc(tilePoint[0], tilePoint[1], this._getRadius(), 0, Math.PI * 2);
        ctx.fill();
        if (this.options.lineColor) {
          ctx.stroke();
        }
      }
    }
  }
});

L.TileLayer.maskCanvas = function(options) {
  return new L.GridLayer.MaskCanvas(options);
};
