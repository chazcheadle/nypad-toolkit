
const bingMapsApiKey = 'AnFPaMaxN1xpYPU07vmKY0Ejl89tpzRIVdXsfQc2i_0mgFCiscaVpVtZzeR1Uqvn';
const url = 'http://molamola.us:8081/geoserver/nypad_postgres/wms?';

var bingStyles = [
    'RoadOnDemand',
    'Aerial',
    'AerialWithLabelsOnDemand',
    'CanvasDark',
    'OrdnanceSurvey'
];

var selectionLayerChoice = 'protectedArea';

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

// Load Counties Shoreline layer (WMS)
// var countiesLayer = new ol.layer.Image({
//     source: new ol.source.ImageWMS({
//         url: url,
//         params: {
//             'LAYERS': 'nypad_postgres:counties_shoreline',
//         },
//         serverType: 'geoserver'
//     })
// })
// countiesLayer.setOpacity(0.8);
// map.addLayer(countiesLayer);

// Load Counties Shoreline vector layer (WFS)
const citiesStyle = new ol.style.Style({
    fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0)'
    }),
    stroke: new ol.style.Stroke({
        color: '#8888FF',
        width: 1,
        // lineDash: [4, 4]
    })
})
var citiesVectorSource = new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    url: function (extent) {
        return 'http://molamola.us:8081/geoserver/nypad_postgres/wfs?service=WFS&' +
            'version=1.1.0' +
            '&request=GetFeature' +
            '&typename=' + 'nypad_postgres:cities_towns' +
            '&outputFormat=application/json' +
            // '&maxFeatures=100' +
            '&srsname=EPSG:3857&,EPSG:3857';
    },
    style: function(feature) {
    },
    strategy: ol.loadingstrategy.bbox,
});
var citiesVectorLayer = new ol.layer.Vector({
    source: citiesVectorSource,
    style: citiesStyle
})
// citiesVectorLayer.setSource(citiesVectorSource);
citiesVectorLayer.setOpacity(0.8);
map.addLayer(citiesVectorLayer);

// Load Counties Shoreline vector layer (WFS)
const countyStyle = new ol.style.Style({
    fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0)'
    }),
    stroke: new ol.style.Stroke({
        color: '#888888',
        width: 2,
        lineDash: [4, 4]
    })
})
// when we move the mouse over a feature, we can change its style to
// highlight it temporarily
var countyHighlightStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: [43, 112, 37],
        width: 2
    }),
    fill: new ol.style.Fill({
        color: [142, 196, 137, 0.5]
    }),
    text: new ol.style.Text({
        font: '12px Calibri,sans-serif',
        fill: new ol.style.Fill({
          color: '#000'
        }),
        stroke: new ol.style.Stroke({
          color: '#f00',
          width:    3
        })
    }),
    zIndex: 100
});

var countyVectorSource = new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    url: function (extent) {
        return 'http://molamola.us:8081/geoserver/nypad_postgres/wfs?service=WFS&' +
            'version=1.1.0' +
            '&request=GetFeature' +
            '&typename=' + 'nypad_postgres:counties_shoreline' +
            '&outputFormat=application/json' +
            '&maxFeatures=100' +
            '&srsname=EPSG:3857&,EPSG:3857';
    },
    style: function(feature) {
        // if (selectionLayerChoice === 'county') {
        //     countyHighlightStyle.getText().setText(feature.get('name'));
        //     return countyHighlightStyle;
        // }
        // else {
        //     return null;
        // }
    },
    strategy: ol.loadingstrategy.bbox,
});

var countyVectorLayer = new ol.layer.Vector({
    source: countyVectorSource,
    style: countyStyle
})

countyVectorLayer.setSource(countyVectorSource);
map.addLayer(countyVectorLayer);




// let hoverInteraction = new ol.interaction.Select({
//     condition: ol.events.condition.pointerMove,
//     layers: [countyVectorLayer]   //Setting layers to be hovered
// });

// map.addInteraction(hoverInteraction);

function changeSelectionLayer(layer) {
    // console.log(layer);
    // Clear selected feature overlay.
    vectorLayer.setSource();
    // Close info box.
    closer.click();
    selectionLayerChoice = layer;
    if (layer === 'county') {
        // map.addInteraction(hoverInteraction);
    }
    else {
        // map.removeInteraction(hoverInteraction);
    }

    // for (let i = 0; i < selectionLayerChoice.length; i++) { 
    //     if (selectionLayerChoice[i].checked) {
    //         const selectLayer = selectionLayerChoice[i].value;
    //         console.log(selectLayer);
    //     }
    // }

}


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
});
// vectorLayer.events.register('loadend', vectorLayer, function(evt) {
//     map.zoomToExtent(vectorLayer.getDataExtent())
// });

map.addLayer(vectorLayer);

var selected = null;
map.on('pointermove', function(e) {
    if (selected !== null) {
        selected.setStyle(undefined);
        selected = null;
      }
    
    map.forEachFeatureAtPixel(e.pixel, function(f) {
        if (selectionLayerChoice === 'county') {
            selected = f;
            f.setStyle(countyHighlightStyle);
            return true;
        }
        else {
            return false;
        }
    });
});
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
    selectionLayerChoice = document.getElementsByName('selection-layer-filter');
    for (let i = 0; i < selectionLayerChoice.length; i++) { 
        if (selectionLayerChoice[i].checked) {
            selectLayer = selectionLayerChoice[i].value;
        }
    }
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
                        populatePopup(selectLayer, feature);
                    }
                    else {
                        cqlFilter = 'abbreviation = \'' + feature.features[0].properties.abbreviation + '\'';
                        layerName = 'nypad_postgres:counties_shoreline';
                        fetch(`/county_data?q=${feature.features[0].properties.abbreviation}`)
                            .then((response) => {
                                return response.text();
                            })
                            .then((data) => {
                                populatePopup(selectLayer, JSON.parse(data));
                            });
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

    if (typeSelect.value === 'Navigate' && selectLayer !== 'county') {
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
function populatePopup(layer, data) {
    console.log(data);
    document.getElementById('popup').style.display = 'unset';
    let html = '';
    if (layer === 'protectedArea') {
        const {
            loc_mang,
            loc_nm,
            loc_own,
            gap_sts,
            nypad_id,
            gis_acres
        } = data.features[0].properties;
        document.getElementById('popup-title').innerHTML = `${loc_nm}`;
        html = `<div class='attr-table'><div>Owner: ${loc_own}</div>
        <div>Agency: ${loc_mang}</div>
        <div>GAP Status: ${gap_sts}</div>
        <div>NYPAD ID: ${nypad_id}</div>    
        <div>Acres: ${formatNumber(gis_acres)}</div></div>`
    }
    else {
        const { total, gap_status } = data;
        document.getElementById('popup-title').innerHTML = `${total.name} County`;
        html = `<div class='attr-table'><div># Protected areas: ${formatNumber(total.total)}</div>
        <div>Protected acreage: ${formatNumber(total.acres)}</div>
        <div>Avg. area acreage: ${formatNumber(total.mean)}</div></div>`;
    }
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


// Initialize jQuery UI plugins on page load.
$(document).ready(function() {
    // Initialize search select field for autocomplete.
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
    // jQuery Accordion control for the menu bar.
    $( "#accordion" ).accordion({
        heightStyle: "content"
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

function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}