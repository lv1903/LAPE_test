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


//var fs = require("fs");
//var http = require("http");

//var topojson = require("topojson");

//var kernel = require("kernel-smooth");

var f = require("./serverfun.js");

var config_obj = {};

config_obj.LAPE_Config = require("./configs/LAPE_Config.json");

config_obj.config_timeSlider = require("./configs/config_timeSlider.json");

config_obj.config_indicator_densitygraph = require("./configs/config_indicator_density_graph.json");
config_obj.config_indicator_wessexmap = require("./configs/config_indicator_wessex_map.json");
config_obj.config_indicator_areafacts = require("./configs/config_indicator_area_facts.json");

config_obj.congig_indicator_text = require("./configs/config_indicator_text.json");
config_obj.config_indicator_bargraph = require("./configs/config_indicator_bar_graph.json");
config_obj.config_indicator_linegraph = require("./configs/config_indicator_line_graph.json");


var topojson_obj = {};

var areaTypeArray = [ //this should be in config!!
    {areaType: "CCG", idKey: "CCG15CD", databaseId: "NyZwkX8Z4x"},
    {areaType: "DU", idKey: "LAD14CD", databaseId: "N1bi86TiBx"},
    {areaType: "CU", idKey: "CTYUA14CD", databaseId: "EyZ9siTiSg"}
];


//try do next function


for(var i in areaTypeArray){

    var areaTypeObj = areaTypeArray[i];
    var areaListObj = config_obj.LAPE_Config.areaList;

    f.getTopoJsons(areaTypeObj, areaListObj, function(areaType, topology){
        console.log(areaType + " topojson acquired")
        topojson_obj[areaType] = topology
    });

}







app.get('/', function(req, res){

        res.render("index", {
            title: "index"
        });

});



app.get("/IndicatorReport/:indicator/:areaType/:genderType", function(req, res){

    var state_obj = {};

    state_obj.reportType = "IndicatorReport"
    state_obj.indicator = req.params["indicator"]; //change this to indicatorType!!
    state_obj.areaType = req.params["areaType"];
    state_obj.genderType = req.params["genderType"];

    var subsetList = f.filterToArray(config_obj.LAPE_Config.areaList[state_obj.areaType], "id");
    //console.log(subsetList)

    var indicatorMapped = encodeURIComponent(config_obj.LAPE_Config.indicatorMapping[state_obj.indicator]);

    //set large limit
    var apiPath = '/v1/datasets/41WGoeXhQg/data?opts={"limit":10000}&filter={"Indicator":"' + indicatorMapped + '","Area%20Type":"' + state_obj.areaType + '","Sex":"' + state_obj.genderType + '"}';
    //console.log(apiPath)

    var options = {
        host: 'q.nqminds.com',
        path: apiPath
    };

    var view = "reportIndicator";

    console.log("request data")
    f.nqm_tbx_query(options, function(body){


        var data_obj = {};

        //extract the subset list for the area you require
        var allObj = JSON.parse(body).data;
        data_obj.data = f.getSubset(allObj, subsetList);

        //get array for density function
        var splitBy = "Map Period";
        var value = "Value";

        //console.log(topojson_obj)

        data_obj.density_obj = f.getDensityObj(allObj, splitBy, value);
        data_obj.orderedList_obj = f.getOrderedListObj(allObj, splitBy, value);
        data_obj.topojson_obj = topojson_obj[state_obj.areaType];


        console.log("render reportIndicator");

        res.render(view, {
            title: view,
            state_obj: state_obj,
            data_obj: data_obj,
            config_obj: config_obj
        });

    });
});

/*
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

*/

console.log("ready")
app.listen(3010);
