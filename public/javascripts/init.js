

var changeView;
var controller;

var ee = new EventEmitter();

window.onload = function() {

    console.log(indicator)


    //
    //changeView = new ChangeView();

    controller = new Controller(data, density_data, topojson_data, LAPE_Config);


    timeSlider = new TimeSlider(config_timeSlider);


    barGraph = new BarGraph(config_indicator_bargraph, indicator);
    barGraph._init();

    lineGraph = new LineGraph(config_indicator_linegraph, indicator);
    lineGraph._init();

    mapD3 = new MapD3(config_indicator_mapD3, indicator);
    mapD3._init();


    //
    ////$('#changeViewModal').modal('show');
    //
    //
    //controller._apply_filter("areaType", "DU")
    //
    //controller._apply_filter("indicator", "1.01 - Months of life lost due to alcohol")

};
