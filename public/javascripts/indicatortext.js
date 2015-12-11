function IndicatorText(config) {
    this.config = config;

    //this.indicator = state.indicator;

    //console.log(this.state)

    this._init();

}

IndicatorText.prototype._init = function(){

    //console.log(controller)

    this.data_period = controller.data_period;

    this._build_graph();
    this._add_text();

    this._bindEvents();




};





IndicatorText.prototype._build_graph = function(){

    validate_NaN_to_0 = this.validate_NaN_to_0;


    var config = this.config;
    var state = controller.state;

    var full_width = 500;
    var full_height = 250;

    this.width =  full_width - config.margin.left  - config.margin.right;
    this.height = full_height - config.margin.bottom - config.margin.top;

    this._svg = d3.select(config.container_id)
        .append("div")
        .classed("svg-container", true)
        .append("svg")
        .attr("class", "widget")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + full_width + " " + full_height )
        .classed("svg-content-responsive", true)

    this._chart = this._svg
        .append('g')
        .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")");

};


IndicatorText.prototype._add_text = function(){


    this._Text = this._chart.selectAll("text")
        .data(this._create_line_array());

    this._Text.enter().append("text")
        .attr("x", 0)
        .attr("y", function(d, i) { return -0.5 + 1.5 * i + "em"})
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", "white")
        .text(function(d){return d});

};



IndicatorText.prototype._bindEvents = function(){
    ee.addListener('period_change', this._period_change_listener.bind(this));
};

/*-------------transitions---------------------*/

IndicatorText.prototype._period_change_listener = function() {

    this._Text
        .data(this._create_line_array())
            .transition()
            .duration(750)
            .text(function(d){return d});

};



/*--------------functions----------------------*/

IndicatorText.prototype._create_line_array = function(){

    var config = this.config;
    var self = this;
    var state = controller.state;

    self.data_period = controller.data_period;

    var subsetData  = []; //get data for area on map
    for(var i in self.data_period){
        if(!isNaN(self.data_period[i][config.value_field])){
            subsetData.push(self.data_period[i][config.value_field])
        }
    }

    format = d3.format(",.0f");

    var lineArr = [

        state.indicator
        + ",",

        controller.config.genderMapping[state.genderType] + " in "
        + "Wessex "
        + controller.config.areaTypeMapping[state.areaType]
        + " in " + state.current_period,

        "",

        "Averages:",

        "Wessex - "
        + format(controller.median(subsetData))
        + " " + controller.config.indicatorLabels[state.indicator],

        "England - "
        + format(controller.median(controller.orderedList_data[state.current_period]))
        + " " + controller.config.indicatorLabels[state.indicator]

    ];


    return lineArr

}