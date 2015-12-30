

var changeView;
var controller;



window.onload = function() {


    controller = new Controller(data_obj, config_obj.master_config, state_obj);


    timeSlider = new TimeSlider(config_obj.config_timeSlider);

    densityGraph = new DensityGraph(config_obj.config_indicator_densitygraph);
    wessexMap = new WessexMap(config_obj.config_indicator_wessexmap)
    areaFacts = new AreaFacts(config_obj.config_indicator_areafacts);
    barGraph = new BarGraph(config_obj.config_indicator_bargraph);
    lineGraph = new LineGraph(config_obj.config_indicator_linegraph);




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
