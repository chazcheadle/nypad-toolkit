
const bingMapsApiKey = 'AnFPaMaxN1xpYPU07vmKY0Ejl89tpzRIVdXsfQc2i_0mgFCiscaVpVtZzeR1Uqvn';
const url = 'http://molamola.us:8081/geoserver/nypad_postgres/wms?';

var bingStyles = [
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
                        imagerySet: bingStyles[2]
                    })
                }),
                new ol.layer.Tile({
                    title: 'Open Street Map',
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
var userSource = new ol.source.Vector();
var userLayer = new ol.layer.Vector({
    source: userSource,
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
map.addLayer(userLayer);
// var modify = new ol.interaction.Modify({ source: userSource });
// map.addInteraction(modify);

userSource.on('addfeature', function(feature) {
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

var countiesLayer = new ol.layer.Image({
    source: new ol.source.ImageWMS({
        url: url,
        params: {
            'LAYERS': 'nypad_postgres:counties_shoreline',
        },
        serverType: 'geoserver'
    })
})
countiesLayer.setOpacity(0.8);
map.addLayer(countiesLayer);

var cqlFilter = '';
var nypadLayer = new ol.layer.Image({
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
nypadLayer.setOpacity(0.8);
map.addLayer(nypadLayer);

var vectorLayer = new ol.layer.Vector({
    source: null
})
map.addLayer(vectorLayer);


/**
 * Handle click events on the map
 * 
 * Zoom to clicked area if it is a feature.
 * Request feature as WFS to highlight.
 */
map.on('singleclick', function (evt) {

    var view = map.getView();



    // Pick the feature layer to select
    let layerUrl = '';
    let selectLayer = '';
    let cqlFilter = '';
    let layerName = '';
    const selectionLayerChoice = document.getElementsByName('selection-layer-filter');
    for (let i = 0; i < selectionLayerChoice.length; i++) { 
        if (selectionLayerChoice[i].checked) {
            selectLayer = selectionLayerChoice[i].value;
        }
    }
    console.log(selectLayer);
    switch (selectLayer) {
        case 'county':
            layerUrl = countiesLayer.getSource().getGetFeatureInfoUrl(
                evt.coordinate, view.getResolution(), view.getProjection(),
                { 'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': 50 });
            break;
        case 'protectedArea':
        default:
            layerUrl = nypadLayer.getSource().getGetFeatureInfoUrl(
                evt.coordinate, view.getResolution(), view.getProjection(),
                { 'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': 50 });
            break;
    }

    if (layerUrl) {
        fetch(layerUrl)
            .then((response) => {
                return response.text();
            })
            .then((text) => {
                var feature = JSON.parse(text)
                if (feature && feature.features.length) {

                    // Set WMS request parameters for the chosen layer type.
                    if (selectLayer === 'protectedArea') {
                        cqlFilter = 'nypad_id = \'' + feature.features[0].properties.nypad_id + '\'';
                        layerName = 'nypad_postgres:nypad_2017';
                        populatePopup(feature);
                    }
                    else {
                        cqlFilter = 'name = \'' + feature.features[0].properties.name + '\'';
                        layerName = 'nypad_postgres:counties_shoreline';
                    }

                    // Retrieve feature vector and add to layer above raster
                    var vectorSource = new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: function (extent) {
                            return 'http://molamola.us:8081/geoserver/nypad_postgres/wfs?service=WFS&' +
                                'version=1.1.0' +
                                '&request=GetFeature' +
                                '&typename=' + layerName +
                                '&CQL_FILTER=' + cqlFilter +
                                '&outputFormat=application/json' +
                                '&maxFeatures=50' +
                                '&srsname=EPSG:3857&,EPSG:3857';
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

    if (typeSelect.value === 'Navigate') {
        view.animate({
            center: evt.coordinate,
            duration: 1000,
            // Zoom in to a resonable level, but do not zoom out if the user has already zoomed in manually.
            zoom: map.getView().getZoom() > 7 ? map.getView().getZoom() : 10
        })
    }
});

// List features on user drawing layer
function listFeatures() {
    console.log(source.getFeatures());
    var writer = new ol.format.GeoJSON();
    var geojsonStr = writer.writeFeatures(source.getFeatures());
    console.log(geojsonStr);
}

// Populate info window
function populatePopup(data) {
    console.log(data);
    document.getElementById('popup').style.display = 'unset';
    const { properties } = data.features[0];
    var html = `<p><strong>Area name:</strong> ${properties.loc_nm}</p>
    <p><strong>Owner:</strong> ${properties.loc_own}</p>
    <p><strong>Agency:</strong> ${properties.loc_mang}</p>
    <p><strong>GAP Status:</strong> ${properties.gap_sts}</p>
    <p><strong>NYPAD ID:</strong> ${properties.nypad_id}</p>    
    <p><strong>Area:</strong> ${properties.gis_acres}</p>`
    document.getElementById('popup-content').innerHTML = html;
}

// Area search function
function searchByArea(reset) {
    let acres = '';
    let operator = '';
    const compare = document.getElementsByName('area-search-filter'); 

    for (let i = 0; i < compare.length; i++) { 
        if (compare[i].checked) 
            operator = compare[i].value;
    }
    acres = document.getElementById('by_area').value;

    if (reset) {
        cqlFilter = (parseInt(acres, 10)) ? `gis_acres ${operator} ${acres}` : null;
    }
    else {
        document.getElementById('by_area').value = '';
        cqlFilter = null;
    }
    nypadLayer.getSource().updateParams({
        'LAYERS': 'nypad_postgis:nypad_2017',
        'CQL_FILTER': cqlFilter
    });
}

// GAP status filter function
function searchByGapStatus(status) {
    cqlFilter = status ? `gap_sts = '${status}'` : null;
    nypadLayer.getSource().updateParams({
        'LAYERS': 'nypad_postgis:nypad_2017',
        'CQL_FILTER': cqlFilter
    });
}

// Local name search function
function getLocalNameSearchResults(name) {
    cqlFilter = name ? `loc_nm = '${name}'` : null;
    nypadLayer.getSource().updateParams({
        'LAYERS': 'nypad_postgis:nypad_2017',
        'CQL_FILTER': cqlFilter
    });
}

// Style filter change event funtion
function changeLayerStyle(style) {
    nypadLayer.getSource().updateParams({
        'STYLES': style
    })
    document.getElementById('legend').src = `${url}Service=WMS&REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=50&HEIGHT=40&LAYER=nypad_postres:nypad_2017&STYLE=${style}&LEGEND_OPTIONS=countMatched:true`

}

// CQL Filter
function searchByCQLFilter() {
    console.log(document.getElementById('cql-filter-query').value);
    const query = document.getElementById('cql-filter-query').value;
    cqlFilter = query ? query : null;
    nypadLayer.getSource().updateParams({
        'LAYERS': 'nypad_postgis:nypad_2017',
        'CQL_FILTER': cqlFilter
    });
}
// DWITHIN(wkb_geometry, collectGeometries(queryCollection('nypad_postgres:nypad_2017','wkb_geometry','nypad_id = ''NYPAD-40507''')), 5000, meters)
// Close info window
var closer = document.getElementById('popup-closer');
closer.onclick = function() {
    document.getElementById('popup').style.display = 'none';
}

// Initialize search select field for autocomplete.
$(document).ready(function() {
    $('#local-name').select2({
        ajax: {
            url: '/autocomplete',
            dataType: 'json',
            data: function (params) {
                var query = {
                    q: params.term,
                }
                return query;
            }
        }
    });
});



//// WIP: Feature drawing and saving code.
// draw.on('drawend', function(event) {
//     console.log(event.feature);
//     var writer = new ol.format.GeoJSON();
//     var geojsonStr = writer.writeFeatures(source.getFeatures());
//     console.log(JSON.parse(geojsonStr));
//     transactWFS('insert', event.feature);
// });

// var formatWFS = new ol.format.WFS();

// var formatGML = new ol.format.GML({
//     featureNS: '',
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
//         $.ajax('', {
//             type: 'POST',
//             dataType: 'xml',
//             processData: false,
//             contentType: 'text/xml',
//             data: payload
//         }).done(function() {
//             // source.clear();
//         });
// }

//// WIP: Vector feature buffer tool
// var vectorSource = new ol.source.Vector({
// fetch('' +
//     'version=1.1.0' +
//     '&request=GetFeature' +
//     '&typename=nypad_postgres:nypad_2017&' +
//     'CQL_FILTER=' + cqlfilter + '&' +
//     'outputFormat=application/json&' +
//     'maxFeatures=50&' +
//     'srsname=EPSG:3857&,EPSG:3857')
//     .then((response) => {
//         return response.json()
//     })
//     .then((json) => {
//         var format = new ol.format.GeoJSON();
//         var features = format.readFeatures(json, {featureProjection: 'EPSG:3857'});
//         console.log(json);
//         var parser = new jsts.io.OL3Parser();
//         parser.inject(new ol.geom.Polygon());
//         for (var i = 0; i < features.length; i++) {
//             var feature = features[i];
//             // convert the OpenLayers geometry to a JSTS geometry
//             console.log(feature.getGeometry());
//             var jstsGeom = parser.read(feature.getGeometry());
//         console.log(jstsGeom);
//             // // create a buffer of 40 meters around each line
//             // var buffered = jstsGeom.buffer(40);
        
//             // // convert back from JSTS and replace the geometry on the feature
//             // feature.setGeometry(parser.write(buffered));
//         }
//         vectorSource.addFeatures(features);

//     })