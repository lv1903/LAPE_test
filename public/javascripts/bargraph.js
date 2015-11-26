function BarGraph(config, indicator) {
    this._config = config;
    this.indicator = indicator;

}

BarGraph.prototype._init = function(){



    console.log("init bar graph");

    this.data = controller._data_period;
    this.data.sort(this._sort_y("numeric"));
    this._build_graph();
    this._set_scales();
    this._draw_axes();
    this._draw_bars();

    //this.test()



};

BarGraph.prototype.validate_NaN_to_0 = function(val){
    if(isNaN(val)) return 0; else return Number(val);
};


BarGraph.prototype._sort_y = function(sort_class) {
    var self = this;

    validate_NaN_to_0 = this.validate_NaN_to_0
    if(sort_class == "alpha"){
        return function (a, b) {return d3.ascending(a[self._config.name_field], b[self._config.name_field]);}
    }
    if(sort_class == "numeric"){
        return function (a, b) {return self.validate_NaN_to_0(b[self._config.value_field]) - self.validate_NaN_to_0(a[self._config.value_field]);}
    }
};

BarGraph.prototype._build_graph = function(){

    validate_NaN_to_0 = this.validate_NaN_to_0;


    var config = this._config;


    var full_width = parseInt(d3.select(config.container_id).style("width"), 10);
    var full_height = Math.max(full_width /2, 400);

    config.margin.left = Math.max(100, full_width /4);  //here
    //config.margin.left = 300


    this.width =  full_width - config.margin.left - config.margin.right;
    this.height = full_height - config.margin.bottom - config.margin.top;

    //console.log(this.width + " x " + this.height)


    this._svg = d3.select(config.container_id)
        .append("svg")
        .attr("class", "widget")
        .attr("width", full_width)
        .attr("height", full_height);

    this._chart = this._svg
        .append('g')
        .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")");


};

/*

BarGraph.prototype.test = function(){

    config = this._config;
    config.margin.left = 50;

    this._chart
        .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")");


};
*/

BarGraph.prototype._set_scales = function(){

    var self = this;
    var config = this._config;

    //config.margin.left = 50;

    this.x = d3.scale.linear().range([0, this.width]);
    this.y = d3.scale.ordinal().rangeRoundBands([0, this.height], .14, .2);

    this.x.domain([0, d3.max(data, function (d) {return self.validate_NaN_to_0(d[config.value_field]);})]);
    this.y.domain( self.data.map(function (d) {return d[config.name_field];}));

};

BarGraph.prototype._draw_axes = function(){

    this.xAxis = d3.svg.axis()
        .scale(this.x)
        .orient("bottom")
        .tickFormat(d3.format("1g"))
        .outerTickSize(0);

    this.yAxis = d3.svg.axis()
        .scale(this.y)
        .orient("right")
        .outerTickSize(0);


    this._chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis);

    this._chart.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(-" + this._config.margin.left + ",0)") //here
        //.attr("transform", "translate(-300,0)") //here
        .call(this.yAxis);


    this._chart.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "end")
        .attr("x", this.width - 20)
        .attr("y", this.height + 40)
        .text(controller._config.indicatorLabels[this.indicator]);

};

BarGraph.prototype._draw_bars = function(){

    var self = this;
    var config = self._config;
    var data = self.data;

    this._bars = this._chart.selectAll(".bar")
        .data(data);

    this._bars.enter().append("rect")
        .attr("class", "bar")
        .attr("x", 3)
        .attr("y", function (d, i) {return self.y(d[config.name_field])})
        .attr("width", function (d, i) {return self.x(self.validate_NaN_to_0(d[config.value_field]))})
        .attr("height", function (d, i) {return self.y.rangeBand()})
        .style("fill", "lightsteelblue")
        .style("stroke", "white")
        .style("stroke-width", 2);
}


