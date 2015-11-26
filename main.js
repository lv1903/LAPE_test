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

var kernel = require("kernel-smooth")


function getSubsetList(areaType){
    var obj = LAPE_Config.areaList[areaType];
    var subsetList = [];
    for(var i in obj){subsetList.push(obj[i].id);}
    return subsetList
}

function getIndicatorMapped(indicator){
    return encodeURIComponent(LAPE_Config.indicatorMapping[indicator]);
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
    var densityObj = {};
    for(var year in splitObj){
        var arr = splitObj[year];


        //create array of integer x points
        var x_arr = []
        for(var i = Math.floor(Math.min.apply(null, arr) - 1); i < Math.ceil(Math.max.apply(null, arr) +1); i++){
            x_arr.push(i);
        };

        var bandwidth = 5;
        var kde = kernel.density(arr, kernel.fun.epanechnikov, bandwidth);
        var density_arr = kde(x_arr);


        //combine the arrays
        var combine_arr = [];
        var combine_obj;
        for(var i = 0; i < x_arr.length; i++){
            combine_obj = {};
            combine_obj.x = x_arr[i];
            combine_obj.density = density_arr[i]
            combine_arr.push(combine_obj)
        }
        densityObj[year] = combine_arr;
    }
    return densityObj
}

function nqm_render_query(options, subsetList, callback){
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

            //extract the subset list for the area you require
            var allObj = JSON.parse(body).data;
            var subsetObj = getSubset(allObj, subsetList);

            //get array for density function
            var splitBy = "Map Period";
            var value = "Value"
            var densityObj = getDensityObj(allObj, splitBy, value);

            callback(subsetObj, datumObj)
        })
    });
    req.on('error', function(e) {
        console.log('ERROR: ' + e.message);
    });
}




var LAPE_Config = require("./configs/LAPE_Config.json");
var config_timeSlider = require("./configs/config_timeSlider.json");

var config_indicator_bargraph = require("./configs/config_indicator_bar_graph.json");
var config_indicator_linegraph = require("./configs/config_indicator_line_graph.json");


app.get('/', function(req, res){

    var options = {
        host: 'q.nqminds.com',
        path: '/v1/datasets/V1WDel7dQe/data?filter={%22Area%20Type%22:%22CU%22,%20%22Sex%22:%22Male%22,%20%22Value%22:%223233.02%22}'
    };

    var view = "index";

    nqm_render_query(options, function(body){
        var obj = JSON.parse(body).data;
        res.render(view, {
            title: view,
            data_obj: obj//,
            //LAPE_Config: LAPE_Config,
            //config_timeSlider: config_timeSlider
        });

    });

});



app.get("/IndicatorReport/:indicator/:areaType/:genderType", function(req, res){



    var indicator = req.params["indicator"];

    //console.log(indicator)

    var areaType = req.params["areaType"];
    var genderType = req.params["genderType"];

    var subsetList = getSubsetList(areaType);
    //console.log(subsetList)

    var indicatorMapped = getIndicatorMapped(indicator);

    var apiPath = '/v1/datasets/41WGoeXhQg/data?opts={"limit":10000}&filter={"Indicator":"' + indicatorMapped + '","Area%20Type":"' + areaType + '","Sex":"' + genderType + '"}';
    //console.log(apiPath)

    var options = {
        host: 'q.nqminds.com',
        path: apiPath
    };

    var view = "reportIndicator";

    console.log("request data")
    nqm_render_query(options, subsetList, function(obj){
        console.log("render reportIndicator");
        res.render(view, {
            title: view,
            indicator: indicator,
            genderType: genderType,
            areaType: areaType,
            data_obj: obj,
            LAPE_Config: LAPE_Config,
            config_timeSlider: config_timeSlider,
            config_indicator_bargraph: config_indicator_bargraph,
            config_indicator_linegraph: config_indicator_linegraph
        });

    });
});

app.get("/AreaReport/:genderType", function(req, res){

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



app.listen(3010);