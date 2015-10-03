iD.Background = function(context) {
    var dispatch = d3.dispatch('change'),
        baseLayer = iD.TileLayer()
        .projection(context.projection),
        gpxLayer = iD.GpxLayer(context, dispatch)
        .projection(context.projection),
        realtimeLayer = iD.RealtimeLayer(context, dispatch)
        .projection(context.projection),
        mapillaryLayer = iD.MapillaryLayer(context),
        overlayLayers = [];

    var backgroundSources, fingerprint;

    socket.on("difference-in", function(data) {

        if(typeof fingerprint == 'undefined'){
            new Fingerprint2().get(function(result){
                fingerprint = result;
            });
        }else{

            if(fingerprint != data.from){

                var emitter = data.from; 
                //console.log(data);
                //var geometries = data.diff.transients;//[data.diff.transients.length-1]; //shows the latest feature, this makes it faster
                var geometries = data.diff;
                var geometry, i, len;
                var geojson = {
                    "type": "FeatureCollection", 
                    "features": [],
                    "properties": { 
                        "color": "#" + data.from.substr(0,6),
                        "from": data.from
                    }
                };
                for (var key in geometries) {
                    if(geometries.hasOwnProperty(key)){
                        var geometry = geometries[key];
                        if(geometry.geometry == 'line') {
                            var feature = {
                                "type": "Feature", 
                                "geometry": geometry.GeoJSON,
                                "properties": { "color": "#" + data.from.substr(0,6)}
                            };
                            geojson.features.push(feature);
                        }
                    }
                }
                
                realtimeLayer.geojson(geojson);
                dispatch.change();
            }
        }
    });
    
    function findSource(id) {
        return _.find(backgroundSources, function(d) {
            return d.id && d.id === id;
        });
    }

    function updateImagery() {
        var b = background.baseLayerSource(),
            o = overlayLayers.map(function(d) {
                return d.source().id;
            }).join(','),
            q = iD.util.stringQs(location.hash.substring(1));

        var id = b.id;
        if (id === 'custom') {
            id = 'custom:' + b.template;
        }

        if (id) {
            q.background = id;
        } else {
            delete q.background;
        }

        if (o) {
            q.overlays = o;
        } else {
            delete q.overlays;
        }

        location.replace('#' + iD.util.qsString(q, true));

        var imageryUsed = [b.imageryUsed()];

        overlayLayers.forEach(function(d) {
            var source = d.source();
            if (!source.isLocatorOverlay()) {
                imageryUsed.push(source.imageryUsed());
            }
        });

        if (background.showsGpxLayer()) {
            imageryUsed.push('Local GPX');
        }

        context.history().imageryUsed(imageryUsed);
    }

    function background(selection) {
        var base = selection.selectAll('.background-layer')
            .data([0]);

        base.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer background-layer');


        base.call(baseLayer);

        var overlays = selection.selectAll('.layer-overlay')
            .data(overlayLayers, function(d) {
                return d.source().name();
            });

        overlays.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer layer-overlay');


        overlays.each(function(layer) {
            d3.select(this).call(layer);
        });

        overlays.exit()
            .remove();


        var realtime = selection.selectAll('.layer-realtime')
            .data([0]);

        realtime.enter().insert('div')
            .attr('class', 'layer-layer layer-realtime');

        realtime.call(realtimeLayer);
        
        var gpx = selection.selectAll('.layer-gpx')
            .data([0]);

        gpx.enter().insert('div')
            .attr('class', 'layer-layer layer-gpx');

        gpx.call(gpxLayer);

        var mapillary = selection.selectAll('.layer-mapillary')
            .data([0]);

        mapillary.enter().insert('div')
            .attr('class', 'layer-layer layer-mapillary');

        mapillary.call(mapillaryLayer);
    }

    background.sources = function(extent) {
        return backgroundSources.filter(function(source) {
            return source.intersects(extent);
        });
    };

    background.dimensions = function(_) {
        baseLayer.dimensions(_);
        gpxLayer.dimensions(_);
        realtimeLayer.dimensions(_);
        mapillaryLayer.dimensions(_);

        overlayLayers.forEach(function(layer) {
            layer.dimensions(_);
        });
    };

    background.baseLayerSource = function(d) {
        if (!arguments.length) return baseLayer.source();

        baseLayer.source(d);
        dispatch.change();
        updateImagery();

        return background;
    };

    background.bing = function() {
        background.baseLayerSource(findSource('Bing'));
    };

    background.hasGpxLayer = function() {
        return !_.isEmpty(gpxLayer.geojson());
    };

    background.hasRealtimeLayer = function() {
        return true;
    };

    background.showsGpxLayer = function() {
        return background.hasGpxLayer() && gpxLayer.enable();
    };

    background.showsRealtimeLayer = function() {
        return background.hasRealtimeLayer() && realtimeLayer.enable();
    };

    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
    }

    background.gpxLayerFiles = function(fileList) {
        var f = fileList[0],
            reader = new FileReader();

        reader.onload = function(e) {
            gpxLayer.geojson(toGeoJSON.gpx(toDom(e.target.result)));
            background.zoomToGpxLayer();
            dispatch.change();
        };

        reader.readAsText(f);
    };

    background.zoomToGpxLayer = function() {
        if (background.hasGpxLayer()) {
            var map = context.map(),
                viewport = map.trimmedExtent().polygon(),
                coords = _.reduce(gpxLayer.geojson().features, function(coords, feature) {
                    var c = feature.geometry.coordinates;
                    return _.union(coords, feature.geometry.type === 'Point' ? [c] : c);
                }, []);

            if (!iD.geo.polygonIntersectsPolygon(viewport, coords)) {
                var extent = iD.geo.Extent(d3.geo.bounds(gpxLayer.geojson()));
                map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
            }
        }
    };

    background.toggleGpxLayer = function() {
        gpxLayer.enable(!gpxLayer.enable());
        dispatch.change();
    };

    background.showsMapillaryLayer = function() {
        return mapillaryLayer.enable();
    };

    background.toggleMapillaryLayer = function() {
        mapillaryLayer.enable(!mapillaryLayer.enable());
        dispatch.change();
    };
    background.showsRealtimeLayer = function() {
        return realtimeLayer.enable();
    };

    background.toggleRealtimeLayer = function() {
        realtimeLayer.enable(!realtimeLayer.enable());
        dispatch.change();
    };

    background.showsLayer = function(d) {
        return d === baseLayer.source() ||
            (d.id === 'custom' && baseLayer.source().id === 'custom') ||
            overlayLayers.some(function(l) {
                return l.source() === d;
            });
    };

    background.overlayLayerSources = function() {
        return overlayLayers.map(function(l) {
            return l.source();
        });
    };

    background.toggleOverlayLayer = function(d) {
        var layer;

        for (var i = 0; i < overlayLayers.length; i++) {
            layer = overlayLayers[i];
            if (layer.source() === d) {
                overlayLayers.splice(i, 1);
                dispatch.change();
                updateImagery();
                return;
            }
        }

        layer = iD.TileLayer()
            .source(d)
            .projection(context.projection)
            .dimensions(baseLayer.dimensions());

        overlayLayers.push(layer);
        dispatch.change();
        updateImagery();
    };

    background.nudge = function(d, zoom) {
        baseLayer.source().nudge(d, zoom);
        dispatch.change();
        return background;
    };

    background.offset = function(d) {
        if (!arguments.length) return baseLayer.source().offset();
        baseLayer.source().offset(d);
        dispatch.change();
        return background;
    };

    background.load = function(imagery) {
        backgroundSources = imagery.map(function(source) {
            if (source.type === 'bing') {
                return iD.BackgroundSource.Bing(source, dispatch);
            } else {
                return iD.BackgroundSource(source);
            }
        });

        backgroundSources.unshift(iD.BackgroundSource.None());

        var q = iD.util.stringQs(location.hash.substring(1)),
            chosen = q.background || q.layer;

        if (chosen && chosen.indexOf('custom:') === 0) {
            background.baseLayerSource(iD.BackgroundSource.Custom(chosen.replace(/^custom:/, '')));
        } else {
            background.baseLayerSource(findSource(chosen) || findSource('Bing') || backgroundSources[1]);
        }

        var locator = _.find(backgroundSources, function(d) {
            return d.overlay && d.default;
        });

        if (locator) {
            background.toggleOverlayLayer(locator);
        }

        var overlays = (q.overlays || '').split(',');
        overlays.forEach(function(overlay) {
            overlay = findSource(overlay);
            if (overlay) background.toggleOverlayLayer(overlay);
        });

        var gpx = q.gpx;
        if (gpx) {
            d3.text(gpx, function(err, gpxTxt) {
                gpxLayer.geojson(toGeoJSON.gpx(toDom(gpxTxt)));
                dispatch.change();
            });
        }
    };

    return d3.rebind(background, dispatch, 'on');
};