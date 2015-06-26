L.TileLayer.MaskCanvas = L.TileLayer.Canvas.extend({
    options: {
        radius: 5, // this is the default radius (specific radius values may be passed with the data)
        useAbsoluteRadius: true,  // true: radius in meters, false: radius in pixels
        color: '#000',
        opacity: 0.5,
        noMask: false,  // true results in normal (filled) circled, instead masked circles
        lineColor: undefined,  // color of the circle outline if noMask is true
        debug: false
    },

    initialize: function (options, data) {
        var self = this;
        L.Util.setOptions(this, options);

        this.drawTile = function (tile, tilePoint, zoom) {
            var ctx = {
                canvas: tile,
                tilePoint: tilePoint,
                zoom: zoom
            };

            if (self.options.debug) {
                self._drawDebugInfo(ctx);
            }
            this._draw(ctx);
        };
    },

    _drawDebugInfo: function (ctx) {
        var max = this.tileSize;
        var g = ctx.canvas.getContext('2d');
        g.globalCompositeOperation = 'destination-over';
        g.strokeStyle = '#000000';
        g.fillStyle = '#FFFF00';
        g.strokeRect(0, 0, max, max);
        g.font = "12px Arial";
        g.fillRect(0, 0, 5, 5);
        g.fillRect(0, max - 5, 5, 5);
        g.fillRect(max - 5, 0, 5, 5);
        g.fillRect(max - 5, max - 5, 5, 5);
        g.fillRect(max / 2 - 5, max / 2 - 5, 10, 10);
        g.strokeText(ctx.tilePoint.x + ' ' + ctx.tilePoint.y + ' ' + ctx.zoom, max / 2 - 30, max / 2 - 10);
    },

  /**
   * Pass either pairs of (y,x) or (y,x,radius) coordinates.
   * Alternatively you can also pass LatLng objects.
   *
   * Whenever there is no specific radius, the default one is used.
   *
   * @param {[[number, number]]|[[number, number, number]]|[L.LatLng]} dataset
   */
    setData: function(dataset) {
        var self = this;


        this.bounds = new L.LatLngBounds(dataset);

        this._quad = new QuadTree(this._boundsToQuery(this.bounds), false, 6, 6);

        var first = dataset[0];
        var xc = 1, yc = 0, rc = 2;
        if (first instanceof L.LatLng) {
            xc = "lng";
            yc = "lat";
        }

        this._maxRadius = 0;
        dataset.forEach(function(d) {
            var radius = d[rc] || self.options.radius;
            self._quad.insert({
                x: d[xc], //lng
                y: d[yc], //lat
                r: radius
            });
            self._maxRadius = Math.max(self._maxRadius, radius);
        });

        if (this._map) {
            this.redraw();
        }
    },

    setRadius: function(radius) {
        this.options.radius = radius;
        this.redraw();
    },

    _tilePoint: function (ctx, coords) {
        // start coords to tile 'space'
        var s = ctx.tilePoint.multiplyBy(this.options.tileSize);

        // actual coords to tile 'space'
        var p = this._map.project(new L.LatLng(coords.y, coords.x));

        // point to draw
        var x = Math.round(p.x - s.x);
        var y = Math.round(p.y - s.y);
        var r = this._calcRadius(coords.r || this.options.radius, coords);
        return [x, y, r];
    },

    _drawPoints: function (ctx, coordinates) {
        var c = ctx.canvas,
            g = c.getContext('2d'),
            self = this,
            p,
            tileSize = this.options.tileSize;
        g.fillStyle = this.options.color;

        if (this.options.lineColor) {
          g.strokeStyle = this.options.lineColor;
          g.lineWidth = this.options.lineWidth || 1;
        }
        g.globalCompositeOperation = 'source-over';
        if (!this.options.noMask) {
            g.fillRect(0, 0, tileSize, tileSize);
            g.globalCompositeOperation = 'destination-out';
        }
        coordinates.forEach(function(coords) {
            p = self._tilePoint(ctx, coords);
            g.beginPath();
            g.arc(p[0], p[1], p[2], 0, Math.PI * 2);
            g.fill();
            if (self.options.lineColor) {
                g.stroke();
            }
        });
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
        return this._getLatRadius() / Math.cos(L.LatLng.DEG_TO_RAD * this._latlng.lat);
    },

    // call to update the radius
    projectLatlngs: function () {
        var lngRadius = this._getLngRadius(),
            latlng2 = new L.LatLng(this._latlng.lat, this._latlng.lng - lngRadius, true),
            point2 = this._map.latLngToLayerPoint(latlng2),
            point = this._map.latLngToLayerPoint(this._latlng);
        this._radius = Math.max(Math.round(point.x - point2.x), 1);
    },

    // the radius of a circle can be either absolute in pixels or in meters
    _getMaxRadius: function(tilePoint) {
        return this._calcRadius(this._maxRadius, tilePoint);
    },

    /**
     * The radius of a circle can be either absolute in pixels or in meters.
     *
     * @param {number} radius Pass either custom point radius, or default radius.
     * @param {L.Point} tilePoint Zoom level
     * @returns {number} Projected radius (stays the same distance in meters across zoom levels).
     * @private
     */
    _calcRadius: function (radius, tilePoint) {
        var projectedRadius;

        if (this.options.useAbsoluteRadius) {
            var latRadius = (radius / 40075017) * 360,
                lngRadius = latRadius / Math.cos(Math.PI / 180 * this._latlng.lat),
                latLng2 = new L.LatLng(this._latlng.lat, this._latlng.lng - lngRadius, true),
                point2 = this._map.latLngToLayerPoint(latLng2, tilePoint.z),
                point = this._map.latLngToLayerPoint(this._latlng, tilePoint.z);

            projectedRadius = Math.max(Math.round(point.x - point2.x), 1);
        } else {
            projectedRadius = radius;
        }

        return projectedRadius;
    },

    _draw: function (ctx) {
        if (!this._quad || !this._map) {
            return;
        }

        var tileSize = this.options.tileSize;

        var nwPoint = ctx.tilePoint.multiplyBy(tileSize);
        var sePoint = nwPoint.add(new L.Point(tileSize, tileSize));

        if (this.options.useAbsoluteRadius) {
            var centerPoint = nwPoint.add(new L.Point(tileSize/2, tileSize/2));
            this._latlng = this._map.unproject(centerPoint);
            this.projectLatlngs();
        }

        // padding
        var pad = new L.Point(this._getMaxRadius(ctx.tilePoint), this._getMaxRadius(ctx.tilePoint));
        nwPoint = nwPoint.subtract(pad);
        sePoint = sePoint.add(pad);

        var bounds = new L.LatLngBounds(this._map.unproject(sePoint), this._map.unproject(nwPoint));

        var coordinates = this._quad.retrieveInBounds(this._boundsToQuery(bounds));

        this._drawPoints(ctx, coordinates);
    }
});

L.TileLayer.maskCanvas = function(options) {
    var mc = new L.TileLayer.MaskCanvas(options);
    leafletVersion = parseInt(L.version.match(/\d{1,}\.(\d{1,})\.\d{1,}/)[1], 10);
    if (leafletVersion < 7) mc._createTile = mc._oldCreateTile;
    return mc;
};
