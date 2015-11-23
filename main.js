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


function getSubsetList(areaType){
    var obj = LAPE_Config.areaList[areaType];
    var subsetList = [];
    for(var i in obj){subsetList.push(obj[i].id);}
    return subsetList
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
            var subsetObj = [];
            for(var i in allObj){
                if(subsetList.indexOf(allObj[i]["Area Code"]) > -1 ){
                    subsetObj.push(allObj[i]);
                }
            }

            callback(subsetObj)
        })
    });
    req.on('error', function(e) {
        console.log('ERROR: ' + e.message);
    });
}


//var dataArray = [];

//function getDataObject(inputFile){
//
//
//    fs.readFile(inputFile, 'utf-8', function (err, data) {
//
//        if (err) throw err;
//
//        //var dataArray = [];
//        var lines = data.trim().split('\n');
//        //console.log(lines)
//        var fields = lines[0].trim().split(',');
//        //console.log(fields)
//        max_fields = fields.length;
//        //console.log(max_fields)
//        var max_lines = lines.length;
//        //console.log(max_lines)
//
//        //for(i = 1; i < 3; i++){
//        for (i = 1; i < max_lines; i++) {
//            oRecord = {};
//            aLine = lines[i].trim().split(',');
//            //console.log(aLine)
//            for (j = 0; j < max_fields; j++) {
//                oRecord[fields[j]] = aLine[j];
//            }
//            dataArray.push(oRecord)
//        }
//        //console.log(dataArray[0])
//        //return dataArray;
//        console.log("dataRead")
//    });
//}

//var inputFile = "data/All_LAPE_test_data.csv";
//var data = getDataObject(inputFile);

var LAPE_Config = require("./configs/LAPE_Config.json")
var config_timeSlider = require("./configs/config_timeSlider.json")


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



app.get("/IndicatorReport/:areaType/:genderType", function(req, res){

    console.log("render reportIndicator");

    var areaType = req.params["areaType"];
    var genderType = req.params["genderType"];
    var apiPath = '/v1/datasets/V1WDel7dQe/data?opts={"limit":10000}&filter={"Area%20Type":"' + areaType + '","Sex":"' + genderType + '"}';

    var subsetList = getSubsetList(areaType);
    //console.log(subsetList)

    var options = {
        host: 'q.nqminds.com',
        path: apiPath
    };

    var view = "reportIndicator";

    nqm_render_query(options, subsetList, function(obj){
        res.render(view, {
            title: view,
            data_obj: obj,
            LAPE_Config: LAPE_Config//,
            //config_timeSlider: config_timeSlider
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