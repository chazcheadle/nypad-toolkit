var bingMapsApiKey = 'AnFPaMaxN1xpYPU07vmKY0Ejl89tpzRIVdXsfQc2i_0mgFCiscaVpVtZzeR1Uqvn';
var url = 'http://molamola.us:8081/geoserver/nypad_postgres/wms?';
var controls;
var styles = [
    'RoadOnDemand',
    'Aerial',
    'AerialWithLabelsOnDemand',
    'CanvasDark',
    'OrdnanceSurvey'
];
var map = new ol.Map({
    controls: [
        new ol.control.OverviewMap(),
        new ol.control.ScaleLine(
            {
                className: 'ol-scale-line',
                target: document.getElementById('scale-line')
            })
    ], 
    target: 'map',
    layers: [
        new ol.layer.Group({
            'title': 'Base maps',
            layers: [
                new ol.layer.Tile({
                    title: 'Bing Aerial',
                    type: 'base',
                    combine: true,
                    visible: false,
                    preload: Infinity,
                    source: new ol.source.BingMaps({
                    key: bingMapsApiKey,
                    imagerySet: styles[2]
                    // use maxZoom 19 to see stretched tiles instead of the BingMaps
                    // "no photos at this zoom level" tiles
                    // maxZoom: 19
                    })
                }),
                // new ol.layer.Group({
                //     // A layer must have a title to appear in the layerswitcher
                //     title: 'Water color with labels',
                //     // Setting the layers type to 'base' results
                //     // in it having a radio button and only one
                //     // base layer being visibile at a time
                //     type: 'base',
                //     // Setting combine to true causes sub-layers to be hidden
                //     // in the layerswitcher, only the parent is shown
                //     combine: true,
                //     visible: false,
                //     layers: [
                //         new ol.layer.Tile({
                //             source: new ol.source.Stamen({
                //                 layer: 'watercolor'
                //             })
                //         }),
                //         new ol.layer.Tile({
                //             source: new ol.source.Stamen({
                //                 layer: 'terrain-labels'
                //             })
                //         })
                //     ]
                // }),
                new ol.layer.Tile({
                    // A layer must have a title to appear in the layerswitcher
                    title: 'Open Street Map',
                    // Again set this layer as a base layer
                    type: 'base',
                    visible: true,
                    source: new ol.source.OSM()
                })
            ],
        })
    ],
    view: new ol.View({
        center: [-8420005, 5286797],
        zoom: 7
    })
});

// Create a blank vector layer to draw on.
var source = new ol.source.Vector();
var vector = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 2
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ffcc33'
            })
        })
    })
});
map.addLayer(vector);
// var modify = new ol.interaction.Modify({ source: source });
// map.addInteraction(modify);

source.on('addfeature', function(feature) {
    console.log(feature);
})


var layerSwitcher2 = new ol.control.LayerSwitcher();
map.addControl(layerSwitcher2);

var draw, snap; // global so we can remove them later
var typeSelect = document.getElementById('type');




// var selectFeat = new ol.interaction.Select();
// map.addInteraction(selectFeat);
// var selectedFeat = selectFeat.getFeatures();

function addInteractions() {
    if (typeSelect.value === 'Navigate') {
        map.removeInteraction();
    }
    else if (typeSelect.value === 'Modify') {
        var selectFeat = new ol.interaction.Select();
        map.addInteraction(selectFeat);
        console.log('selected');
        var selectedFeat = selectFeat.getFeatures();
        var modifyFeat = new ol.interaction.Modify({
            features: selectedFeat
        });
        map.addInteraction(modifyFeat);
    }
    else {
        draw = new ol.interaction.Draw({
            source: source,
            type: typeSelect.value
        });
        map.addInteraction(draw);
        snap = new ol.interaction.Snap({ source: source });
        map.addInteraction(snap);
    }
}

/**
 * Handle change event.
 */
typeSelect.onchange = function () {
    map.removeInteraction(draw);
    map.removeInteraction(snap);
    addInteractions();
};

addInteractions();

var counties = new ol.layer.Image({
    source: new ol.source.ImageWMS({
        url: url,
        params: {
            'LAYERS': 'nypad_postgres:counties_shoreline',
        },
        serverType: 'geoserver'
    })
})
counties.setOpacity(0.8);
map.addLayer(counties);

var cqlFilter = '';
var nypad = new ol.layer.Image({
    source: new ol.source.ImageWMS({
        url: url,
        params: {
            'LAYERS': 'nypad_postgres:nypad_2017',
            'CQL_FILTER': cqlFilter || null,
            'STYLES': 'nypad_gap_codes'
        },
        serverType: 'geoserver'
    })
})
nypad.setOpacity(0.8);
map.addLayer(nypad);

var vectorLayer = new ol.layer.Vector({
    source: null
})
map.addLayer(vectorLayer);


    // draw.on('drawend', function(event) {
    //     console.log(event.feature);
    //     var writer = new ol.format.GeoJSON();
    //     var geojsonStr = writer.writeFeatures(source.getFeatures());
    //     console.log(JSON.parse(geojsonStr));
    //     transactWFS('insert', event.feature);
    // });

// var formatWFS = new ol.format.WFS();

// var formatGML = new ol.format.GML({
//     featureNS: 'http://molamola.us:8081/geoserver/nypad_postgres/wfs',
//     featureType: 'the_geom',
//     srsName: 'EPSG:3857'    
// });
// var xs = new XMLSerializer();
// function transactWFS(mode, f) {
//     console.log('transactWFS()');
//     var node;
//         switch (mode) {
//             case 'insert':
//                 node = formatWFS.writeTransaction([f], null, null, formatGML);
//                 break;
//             case 'update':
//                 node = formatWFS.writeTransaction(null, [f], null, formatGML);
//                 break;
//             case 'delete':
//                 node = formatWFS.writeTransaction(null, null, [f], formatGML);
//                 break;
//         }
//         var payload = xs.serializeToString(node);
//         console.log(payload);
//         $.ajax('http://molamola.us:8081/geoserver/nypad_postgres/wfs', {
//             type: 'POST',
//             dataType: 'xml',
//             processData: false,
//             contentType: 'text/xml',
//             data: payload
//         }).done(function() {
//             // source.clear();
//         });
// }

map.on('singleclick', function (evt) {

    var view = map.getView();
    // view.animate({
    //     center: evt.coordinate,
    //     duration: 400
    // });
    if (typeSelect.value === 'Navigate') {
        view.animate({
            center: evt.coordinate,
            duration: 500
        })
    }
    var url = nypad.getSource().getGetFeatureInfoUrl(
        evt.coordinate, view.getResolution(), view.getProjection(),
        { 'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': 50 });

    if (url) {
        console.log(url);
        // document.getElementById('info').src = url;
        var format = new ol.format.GeoJSON();
        var record;
        fetch(url)
            .then((response) => {
                return response.text();
            })
            .then((text) => {
                var feature = JSON.parse(text)
                if (feature && feature.features.length) {

                    // const extent = feature.features[0].getGeometry().getExtent()
                    // map.getView().fit(extent);
                    populatePopup(feature);
                    
                    // Retrieve feature vector and add to layer above raster
                    var cqlfilter = 'nypad_id = \'' + feature.features[0].properties.nypad_id + '\'';
                    var vectorSource = new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: function (extent) {
                            return 'http://molamola.us:8081/geoserver/nypad_postgres/wfs?service=WFS&' +
                                'version=1.1.0' +
                                '&request=GetFeature' +
                                '&typename=nypad_postgres:nypad_2017&' +
                                'CQL_FILTER=' + cqlfilter + '&' +
                                'outputFormat=application/json&' +
                                'maxFeatures=50&' +
                                'srsname=EPSG:3857&,EPSG:3857';
                        },
                        strategy: ol.loadingstrategy.bbox,
                        style: new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: 'rgba(255, 255, 255, 1)'
                            }),
                            stroke: new ol.style.Stroke({
                                color: '#ffcc33',
                                width: 2
                            })
                        })
                    });
                    vectorLayer.setSource(vectorSource);
                }
            });
    }
});

function listFeatures() {
    console.log(source.getFeatures());
    var writer = new ol.format.GeoJSON();
    var geojsonStr = writer.writeFeatures(source.getFeatures());
    console.log(geojsonStr);
}

function populatePopup(data) {
    console.log(data);
    document.getElementById('popup').style.display = 'unset';
    const { properties } = data.features[0];
    var html = `<p><strong>Area name:</strong> ${properties.loc_nm}</p>
    <p><strong>Owner:</strong> ${properties.loc_own}</p>
    <p><strong>Agency:</strong> ${properties.loc_mang}</p>
    <p><strong>GAP Status:</strong> ${properties.gap_sts}</p>
    <p><strong>Area:</strong> ${properties.gis_acres}</p>`
    document.getElementById('popup-content').innerHTML = html;

}

function searchByArea() {
    let acres = '';
    let operator = '';
    const compare = document.getElementsByName('area-search-filter'); 

    for (let i = 0; i < compare.length; i++) { 
        if (compare[i].checked) 
            operator = compare[i].value;
    }
    acres = document.getElementById('by_area').value;
    console.log(`gis_acres ${operator} ${acres}`);
    cqlFilter = (parseInt(acres, 10)) ? `gis_acres ${operator} ${acres}` : null;
    nypad.getSource().updateParams({
        'LAYERS': 'nypad_postgis:nypad_2017',
        'CQL_FILTER': cqlFilter
    });
}

function searchByGapStatus(status) {
    cqlFilter = status ? `gap_sts = '${status}'` : null;
    nypad.getSource().updateParams({
        'LAYERS': 'nypad_postgis:nypad_2017',
        'CQL_FILTER': cqlFilter
    });
}

var closer = document.getElementById('popup-closer');
closer.onclick = function() {
    document.getElementById('popup').style.display = 'none';
}

function changeLayerStyle(style) {
    nypad.getSource().updateParams({
        'STYLES': style
    })
    document.getElementById('legend').src = `http://molamola.us:8081/geoserver/nypad_postgres/wms?Service=WMS&REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=50&HEIGHT=40&LAYER=nypad_postres:nypad_2017&STYLE=${style}&LEGEND_OPTIONS=countMatched:true`

}
// var legend = new ol.control.Legend({
//     title: 'LEGENDARY THING',
//     target: 'map',
//     style: 'nypad_gap_codes'
// });
// map.addControl(legend);
