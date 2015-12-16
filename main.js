/**
 * Created by leovalberg on 27/10/2015.
 */



var express = require("express");
var jade = require("jade");
var bodyParser = require("body-parser");
var app = express();


app.set("views", __dirname + "/views");
app.set("view engine","jade");
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json({limit: (5*1024*1000) }));


var fs = require("fs");
var http = require("http");

var topojson = require("topojson");

var kernel = require("kernel-smooth");


//geojson query
//http://q.nqminds.com/v1/datasets/NyZwkX8Z4x/data?filter={%22properties.CCG15CD%22:{%22$in%22:[%22E38000045%22,%22E38000059%22]}}


function getGeoJsonFromTBX(arr){

}



function getTopoJsons(){
    //input: object with key for area type
    // and property as array of entity objects for required boundaries
    //id is the key for the enitiy objects
    //output: object with key for area type
    // and geojson feature collection as property


    var geoJsonCollections = {};



    var request_array =  [
                            "E38000120",
                            "E38000059",
                            "E38000087",
                            "E38000137",
                            "E38000154",
                            "E38000167",
                            "E38000198",
                            "E38000045",
                            "E38000118",
                            "E38000206"
                        ];

    //var request_array =  [
    //    "E38000120",
    //    "E38000059"
    //];

    var string_request_array = JSON.stringify(request_array)


    var apiPath = '/v1/datasets/NyZwkX8Z4x/data?filter={"properties.CCG15CD":{"$in":' + string_request_array + '}}';
    //console.log(apiPath)

    var options = {
        host: 'q.nqminds.com',
        path: apiPath
    };

    console.log("request data")
    nqm_tbx_query(options, function(body){

        var features = JSON.parse(body).data;

        //combine features into feature collection
        var collection = {
            "type": "FeatureCollection",
            "features": []

        };
        for(var i in features){
            collection.features.push(features[i])
        }
        //console.log(collection)

        geoJsonCollections.CCG = collection

        var qVal = 1e1;
        var sVal = 1e-3;

        var id = "CCG15CD";//needs to go in config file


        var topology = topojson.topology({collection: collection},
                                            {"property-transform":function(feature) {return {"id": feature.properties[id]} ;}}//,
                                            //{"id":function(feature){return feature.properties.CCG15CD;}}
        );
        var topology = topojson.simplify(topology, {"coordinate-system":"cartesian", "quantization":qVal, "minimum-area": sVal});


        topojson_obj = {"CCG": topology}

        console.log("got topojson")

    });

}
var topojson_obj;
getTopoJsons();

function getSubsetList(areaType){
    var obj = config_obj.LAPE_Config.areaList[areaType];
    var subsetList = [];
    for(var i in obj){subsetList.push(obj[i].id);}
    return subsetList
}

function getIndicatorMapped(indicator){
    return encodeURIComponent(config_obj.LAPE_Config.indicatorMapping[indicator]);
}


function getSubset(allObj, subsetList){
    var subsetObj = [];
    for(var i in allObj){
        if(subsetList.indexOf(allObj[i]["Area Code"]) > -1 ){ // area code should be in a config file
            subsetObj.push(allObj[i]);
        }
    }
    return subsetObj
}

function getDensityObj(allObj, split_field, value_field){

    //console.log(allObj.length)

    //get max value
    var max_x = 0;
    for(var i in allObj){
        if(allObj[i][value_field] > max_x){ max_x = allObj[i][value_field]}
    }

    //add 5% to max value to make graph cleaner
    max_x = 1.1 * max_x;

    //console.log(max_x)

    //create x_arr
    var x_arr = []
    for(var i = 0; i <=  max_x; i++){
        x_arr.push(i);
    };


    //split the data into arrays (eg. one for each year)
    var splitObj = {};
    for(var i in allObj){


        var year = allObj[i][split_field];
        if(!splitObj.hasOwnProperty(year)){
            splitObj[year] = [];
        }
        splitObj[year].push(allObj[i][value_field])
    }

    //for each array in split obj get datum for density function
    var densityObj = [];
    for(var year in splitObj){
        var arr = splitObj[year];

        var bandwidth = max_x / 5;
        var kde = kernel.density(arr, kernel.fun.epanechnikov, bandwidth);
        var density_arr = kde(x_arr);


        //combine the arrays
        var combine_obj;
        for(var i = 0; i < x_arr.length; i++){
            combine_obj = {};
            combine_obj.x = x_arr[i];
            combine_obj.density = density_arr[i]
            combine_obj["Map Period"] = year
            densityObj.push(combine_obj)
        }
    }
    return densityObj
}


function getOrderedListObj(allObj, split_field, value_field){

    //returns object of ordered arrays of values - to be used for calculating quintiles etc.

    var splitObj = {};
    for(var i in allObj){
        var year = allObj[i][split_field];
        if(!splitObj.hasOwnProperty(year)){
            splitObj[year] = [];
        }
        splitObj[year].push(allObj[i][value_field])
    };
    return splitObj

}

function nqm_tbx_query(options, callback){
    //requests data from tbx and returns body string

    var req = http.get(options, function(res) {
        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));
        // Buffer the body entirely for processing as a whole.
        var bodyChunks = [];
        res.on('data', function(chunk) {
            // You can process streamed parts here...
            bodyChunks.push(chunk);
        }).on('end', function() {
            var body = Buffer.concat(bodyChunks);

            ////extract the subset list for the area you require
            //var allObj = JSON.parse(body).data;
            //var subsetObj = getSubset(allObj, subsetList);
            //
            ////get array for density function
            //var splitBy = "Map Period";
            //var value = "Value"
            //var densityObj = getDensityObj(allObj, splitBy, value);

            //callback(subsetObj, densityObj)

            callback(body)
        })
    });
    req.on('error', function(e) {
        console.log('ERROR: ' + e.message);
    });
}




var config_obj = {};

config_obj.LAPE_Config = require("./configs/LAPE_Config.json");

config_obj.config_timeSlider = require("./configs/config_timeSlider.json");

config_obj.config_indicator_densitygraph = require("./configs/config_indicator_density_graph.json");
config_obj.config_indicator_wessexmap = require("./configs/config_indicator_wessex_map.json");
config_obj.config_indicator_areafacts = require("./configs/config_indicator_area_facts.json");

config_obj.congig_indicator_text = require("./configs/config_indicator_text.json");
config_obj.config_indicator_bargraph = require("./configs/config_indicator_bar_graph.json");
config_obj.config_indicator_linegraph = require("./configs/config_indicator_line_graph.json");



app.get('/', function(req, res){

        res.render("index", {
            title: "index"
        });

});



app.get("/IndicatorReport/:indicator/:areaType/:genderType", function(req, res){

    console.log("1")

    var state_obj = {};

    console.log("2")

    state_obj.indicator = req.params["indicator"];

    console.log("3")

    //console.log(indicator)

    state_obj.areaType = req.params["areaType"];
    state_obj.genderType = req.params["genderType"];

    console.log("4")

    var subsetList = getSubsetList(state_obj.areaType);
    //console.log(subsetList)

    console.log("5")

    var indicatorMapped = getIndicatorMapped(state_obj.indicator);

    console.log("6")

    var apiPath = '/v1/datasets/41WGoeXhQg/data?opts={"limit":10000}&filter={"Indicator":"' + indicatorMapped + '","Area%20Type":"' + state_obj.areaType + '","Sex":"' + state_obj.genderType + '"}';
    //console.log(apiPath)

    console.log("7")

    var options = {
        host: 'q.nqminds.com',
        path: apiPath
    };

    var view = "reportIndicator";

    console.log("request data")
    nqm_tbx_query(options, function(body){



        var data_obj = {};

        //extract the subset list for the area you require
        var allObj = JSON.parse(body).data;
        data_obj.data = getSubset(allObj, subsetList);

        //get array for density function
        var splitBy = "Map Period";
        var value = "Value";

        data_obj.density_obj = getDensityObj(allObj, splitBy, value);
        data_obj.orderedList_obj = getOrderedListObj(allObj, splitBy, value);
        data_obj.topojson_obj = topojson_obj[state_obj.areaType]


        console.log("render reportIndicator");

        res.render(view, {
            title: view,

            state_obj: state_obj,
            //indicator: indicator,
            //genderType: genderType,
            //areaType: areaType,

            data_obj: data_obj,

            //topojson_obj: topojson_obj[areaType],
            //density_obj: density_obj,
            //orderedList_obj: orderedList_obj,

            config_obj: config_obj

            //LAPE_Config: LAPE_Config,
            //config_timeSlider: config_timeSlider,
            //config_indicator_bargraph: config_indicator_bargraph,
            //config_indicator_linegraph: config_indicator_linegraph,
            //config_indicator_mapD3: config_indicator_mapD3
        });

    });
});

app.get("/AreaReport/:Area/:genderType", function(req, res){

    var genderType = req.params["genderType"]

    console.log(genderType)

    if(genderType == "Persons"){
        console.log("render reportAreaPersons");
        res.render("reportAreaPersons", {
            title: "areaPersons"//,
            //data_obj: dataArray,
            //LAPE_Config: LAPE_Config,
            //config_timeSlider: config_timeSlider
        });
    };

    if(genderType == "Gender"){
        console.log("render reportAreaGender");
        res.render("reportAreaGender", {
            title: "areaGender"//,
            //data_obj: dataArray,
            //LAPE_Config: LAPE_Config,
            //config_timeSlider: config_timeSlider
        });
    }

});


app.get("/CompareAreas", function(req, res){
    console.log("render reportCompare");
    res.render("reportCompare",{
        title: "compare"//,
        //data_obj: dataArray,
        //LAPE_Config: LAPE_Config,
        //config_timeSlider: config_timeSlider
    });
});


console.log("ready")
app.listen(3010);
