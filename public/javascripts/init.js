

var changeView;
var controller;

var ee = new EventEmitter();

window.onload = function() {

    console.log(indicator)


    //
    //changeView = new ChangeView();

    controller = new Controller(data, LAPE_Config);


    timeSlider = new TimeSlider(config_timeSlider);

    barGraph = new BarGraph(config_indicator_bargraph, indicator);
    barGraph._init()


    //
    ////$('#changeViewModal').modal('show');
    //
    //
    //controller._apply_filter("areaType", "DU")
    //
    //controller._apply_filter("indicator", "1.01 - Months of life lost due to alcohol")

};
