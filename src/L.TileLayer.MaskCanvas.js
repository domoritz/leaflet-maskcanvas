L.TileLayer.MaskCanvas = L.TileLayer.Canvas.extend({
	options: {
        radius: 5,
        color: '#000',
        opacity: 0.5,
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

    _createTile: function () {
        var tile = this._canvasProto.cloneNode(false);
        tile.onselectstart = tile.onmousemove = L.Util.falseFn;

        var tileSize = this.options.tileSize;
        var g = tile.getContext('2d');
        g.fillStyle = this.options.color;
        g.fillRect(0, 0, tileSize, tileSize);
        g.globalCompositeOperation = 'destination-out';
        return tile;
    },

    setData: function(dataset) {
        var self = this;

        this.bounds = new L.LatLngBounds(dataset);

        this._quad = new QuadTree(this._boundsToQuery(this.bounds), false, 10, 8);

        dataset.forEach(function(d) {
            self._quad.insert({
                x: d[1], //lng
                y: d[0] //lat
            });
        });
        this.redraw();
    },

    _tilePoint: function (ctx, coords) {
        // start coords to tile 'space'
        var s = ctx.tilePoint.multiplyBy(this.options.tileSize);

        // actual coords to tile 'space'
        var p = this._map.project(new L.LatLng(coords[0], coords[1]));

        // point to draw
        var x = Math.round(p.x - s.x);
        var y = Math.round(p.y - s.y);
        return [x, y];
    },

    _drawPoints: function (ctx, coordinates) {
        var c = ctx.canvas;
        var g = c.getContext('2d');
        var self = this;
        var p;
        coordinates.forEach(function(coords){
            p = self._tilePoint(ctx, coords);
            g.beginPath();
            g.arc(p[0], p[1], self.options.radius, 0, Math.PI * 2);
            g.fill();
        });
    },

    _boundsToQuery: function(bounds) {
        return {
            x: bounds.getSouthWest().lng,
            y: bounds.getSouthWest().lat,
            width: bounds.getNorthEast().lng-bounds.getSouthWest().lng,
            height: bounds.getNorthEast().lat-bounds.getSouthWest().lat
        };
    },

    _draw: function (ctx) {
        var tileSize = this.options.tileSize;

        var nwPoint = ctx.tilePoint.multiplyBy(tileSize);
        var sePoint = nwPoint.add(new L.Point(tileSize, tileSize));

        // padding
        var pad = new L.Point(this.options.radius, this.options.radius);
        nwPoint = nwPoint.subtract(pad);
        sePoint = sePoint.add(pad);

        var bounds = new L.LatLngBounds(this._map.unproject(sePoint), this._map.unproject(nwPoint));

        var coordinates = [];
        this._quad.retrieveInBounds(this._boundsToQuery(bounds)).forEach(function(obj) {
            coordinates.push([obj.y, obj.x]);
        });

        this._drawPoints(ctx, coordinates);

        var c = ctx.canvas;
        var g = c.getContext('2d');
    }
});

L.TileLayer.maskCanvas = function (options) {
    return new L.TileLayer.MaskCanvas(options);
};