/**
 * Created by leovalberg on 17/12/2015.
 */

module.exports = {



    getTopoJsons: function(areaTypeObj, areaListObj, callback){
        //input: object with key for area type
        // and property as array of entity objects for required boundaries
        //id is the key for the enitiy objects
        //output: object with key for area type
        // and geojson feature collection as property

        //var fs = require("fs")
        //
        //var util = require('util');
        //var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
        //var log_stdout = process.stdout;
        //
        //console.log = function(d) { //
        //    log_file.write(util.format(d) + '\n');
        //    log_stdout.write(util.format(d) + '\n');
        //};


        var topojson = require("topojson");


        var areaType = areaTypeObj.areaType;
        var idKey =  areaTypeObj.idKey;
        var databaseId = areaTypeObj.databaseId

        var request_array = this.filterToArray(areaListObj[areaType], "id");
        var string_request_array = JSON.stringify(request_array);

        var apiPath = '/v1/datasets/' +  databaseId + '/data?filter={"properties.' +  idKey + '":{"$in":' + string_request_array + '}}';
        //console.log(apiPath)


        var options = {
            host: 'q.nqminds.com',
            path: apiPath
        };

        console.log("request data")
        this.nqm_tbx_query(options, function(body){

             var features = JSON.parse(body).data;

            //console.log(features)

            //combine features into feature collection
            var collection = {
                "type": "FeatureCollection",
                "features": []

            };
            for(var i in features){
                //console.log(features[i])
                collection.features.push(features[i])
            }

            var qVal = 1e1;
            var sVal = 1e-3;

            var topology = topojson.topology(
                {collection: collection},
                {"property-transform":function(feature) {return {"id": feature.properties[idKey]} ;}}//,
            );
            var topology = topojson.simplify(topology, {"coordinate-system":"cartesian", "quantization":qVal, "minimum-area": sVal});

            callback(areaType, topology)

        })

        //console.log("got topojson");
        //console.log(topojson_obj)
        //
        //callback(topojson_obj)

    },


    filterToArray: function(obj, key){
        //extract the key property from obj into array
        var arr = [];
        for(var i in obj){arr.push(obj[i][key]);}
        return arr
    },


    getSubset: function(allObj, subsetList){
        var subsetObj = [];
        for(var i in allObj){
            if(subsetList.indexOf(allObj[i]["Area Code"]) > -1 ){ // area code should be in a config file
                subsetObj.push(allObj[i]);
            }
        }
        return subsetObj
    },

    getDensityObj: function(allObj, split_field, value_field){

        var kernel = require("kernel-smooth");

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
    },


    getOrderedListObj: function(allObj, split_field, value_field){

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

    },

    nqm_tbx_query: function(options, callback){
        //requests data from tbx and returns body string

        var http = require("http");

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




}