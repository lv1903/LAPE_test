

var changeView;
var controller;



window.onload = function() {


    //console.log("********")
    //
    //console.log(state_obj)


    //
    //changeView = new ChangeView();

    controller = new Controller(data_obj, config_obj.LAPE_Config, state_obj);

    //console.log(config_obj.config_timeSlider)



    indicatorText = new IndicatorText(config_obj.congig_indicator_text);
    mapD3 = new MapD3(config_obj.config_indicator_mapD3);
    barGraph = new BarGraph(config_obj.config_indicator_bargraph);
    lineGraph = new LineGraph(config_obj.config_indicator_linegraph);

    timeSlider = new TimeSlider(config_obj.config_timeSlider);
    //
    ////$('#changeViewModal').modal('show');
    //
    //
    //controller._apply_filter("areaType", "DU")
    //
    //controller._apply_filter("indicator", "1.01 - Months of life lost due to alcohol")

};
