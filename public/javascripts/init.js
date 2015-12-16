

var changeView;
var controller;



window.onload = function() {





    //console.log("********")
    //
    //console.log(state_obj)


    //
    //changeView = new ChangeView();

    controller = new Controller(data_obj, config_obj.LAPE_Config, state_obj);


    timeSlider = new TimeSlider(config_obj.config_timeSlider);

    /*------get averages for density widget------------------------*/
    var objAverages = [];

    obj = {"name": "England"};
    for(var year in controller.orderedList_data){
        var median = controller.median(controller.orderedList_data[year]);
        obj[year] = median;
    }
    objAverages.push(obj);

    obj = {"name": "Wessex"};
    var nest = d3.nest()
        .key(function(d){return d["Map Period"]})
        .entries(controller.data);

    for(var i in nest){
        var year = nest[i].key;
        var median = controller.median(nest[i].values.map(function(d){return d.Value}));
        obj[year] = median;
    }
    objAverages.push(obj);
    //console.log(objAverages)
    /*-------------------------------------------------------------------*/
    densityGraph = new DensityGraph(config_obj.config_indicator_densitygraph, objAverages);

    //console.log(config_obj)

    wessexMap = new WessexMap(config_obj.config_indicator_wessexmap)
    areaFacts = new AreaFacts(config_obj.config_indicator_areafacts);
    barGraph = new BarGraph(config_obj.config_indicator_bargraph);
    lineGraph = new LineGraph(config_obj.config_indicator_linegraph);

    //
    //indicatorText = new IndicatorText(config_obj.congig_indicator_text);
    //
    ////$('#changeViewModal').modal('show');
    //
    //
    //controller._apply_filter("areaType", "DU")
    //
    //controller._apply_filter("indicator", "1.01 - Months of life lost due to alcohol")


};

//---d3 functions--------------

d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
