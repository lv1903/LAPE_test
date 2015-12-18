function BarGraph(config) {

    this.config = config;
    this.cs = controller.config.colorScheme;
    //this.indicator = state_obj.indicator;

    this._init();



}

BarGraph.prototype._init = function(){



    console.log("init bar graph");

    this.data_period = controller.data_period;
    this.data_period.sort(this._sort_y("alpha"));
    this._build_graph();
    this._set_scales();
    //this._draw_axes();
    this._draw_bars();
    this._draw_header();

    this._bindEvents();

};






BarGraph.prototype.validate_NaN_to_0 = function(val){
    if(isNaN(val)) return 0; else return Number(val);
};


BarGraph.prototype._sort_y = function(sort_class) {
    var self = this;

    validate_NaN_to_0 = this.validate_NaN_to_0
    if(sort_class == "alpha"){
        return function (a, b) {return d3.ascending(a[self.config.name_field], b[self.config.name_field]);}
    }
    if(sort_class == "numeric"){
        return function (a, b) {return self.validate_NaN_to_0(b[self.config.value_field]) - self.validate_NaN_to_0(a[self.config.value_field]);}
    }
};

BarGraph.prototype._build_graph = function(){

    validate_NaN_to_0 = this.validate_NaN_to_0;


    var config = this.config;

    var full_width = 300;
    var full_height = 300;

    config.middle = full_width / 2;

    config.margin.middle = 2;

    this.width =  config.middle - config.margin.left  - config.margin.middle;
    this.height = full_height - config.margin.bottom - config.margin.top;

    this._svg = d3.select(config.container_id)
        .append("div")
        .classed("svg-container", true)
        .append("svg")
        .attr("class", "widget")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + full_width + " " + full_height )
        .classed("svg-content-responsive", true)

    this._chart_left = this._svg
        .append('g')
        .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")");


    this._chart_right = this._svg
        .append('g')
        .attr("transform", "translate(" + (config.middle + config.margin.middle) + "," + config.margin.top + ")");


};


BarGraph.prototype._set_scales = function(){

    var self = this;
    var config = this.config;

    console.log(self.data_period.length)

    this.x = d3.scale.linear().range([0, this.width]);


    //adjust height of bar graph for more lines
    var y0 = 0;
    var y1 = this.height;

    if(self.data_period.length > 7 && self.data_period.length <= 15){
        console.log("here")
        y1 += 21;
    }else if( self.data_period.length > 15){
        console.log("there")
        y0 -= 21;
        y1 += 56;
    }

    console.log(y0 + " -> " + y1)

    this.y = d3.scale.ordinal().rangeRoundBands([y0, y1], .14, .2);




    this.x.domain([0, d3.max(self.data_period, function (d) {return self.validate_NaN_to_0(d[config.value_field]);})]);
    this.y.domain( self.data_period.map(function (d) {return d[config.name_field];}));

};

BarGraph.prototype._draw_axes = function(){

    var state = controller.state;

    this.xAxis_right = d3.svg.axis()
        .scale(this.x)
        .orient("bottom")
        .tickFormat(d3.format("1g"))
        .ticks(5)
        .outerTickSize(0);



    this._chart_right.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis_right);



    this._chart_right.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "end")
        .attr("x", this.width - 20)
        .attr("y", this.height + 40)
        .text(controller.config.indicatorLabels[state.indicator]);


};

BarGraph.prototype._draw_bars = function(){

    var self = this;
    var config = self.config;
    var data = self.data_period;
    var state = controller.state;


    this._background_bars_right = this._chart_right.selectAll(".background_bar")
        .data(data);

    this._background_bars_right.enter().append("rect")
        .attr("class", "background bar clickable")
        .attr("x", 3)
        .attr("y", function (d, i) {return self.y(d[config.name_field])})
        .attr("width", self.width)
        .attr("height", function (d, i) {return self.y.rangeBand()})
        .style("fill", "white") //config file???
        .style("stroke-width", "0")
        .on("click", self._bar_click.bind(this));


    this._bars = this._chart_right.selectAll(".foreground bar")
        .data(data);

    this._bars.enter().append("rect")
        .attr("class", "foreground bar clickable")
        .attr("x", 3)
        .attr("y", function (d, i) {return self.y(d[config.name_field])})

        .attr("height", function (d, i) {return self.y.rangeBand()})
        .style("stroke-width", "0")
        .style("fill", function(d){ return self._select_color(d)})
        .on("click", self._bar_click.bind(this));

    //check if data is available and add change graph
    if(controller.data_period.length == 0) {
        this._bars.attr("width", 0)
    } else {
        this._bars.attr("width", function (d, i) {return self.x(self.validate_NaN_to_0(d[config.value_field]))})
    }


    this._background_bars_left = this._chart_left.selectAll(".background_bar")
        .data(data);

    this._background_bars_left.enter().append("rect")
        .attr("class", "background_bar clickable" )
        .attr("x", 3)
        .attr("y", function (d, i) {return self.y(d[config.name_field])})
        .attr("width", self.width)
        .attr("height", function (d, i) {return self.y.rangeBand()})
        .style("stroke-width", "0")
        .style("fill", function(d){ return self._select_color(d)})
        .on("click", self._bar_click.bind(this));


    this._label = this._chart_left.selectAll(".name text")
        .data(data);


    this._label.enter().append("text")
        .attr("class", "name text clickable")
        .attr("x", "0.5em")
        .attr("y", function (d, i) {return (self.y(d[config.name_field]) + self.y(d[config.name_field]) + self.y.rangeBand()) / 2})
        .attr("dy", "0.4em")
        .text(function(d, i){return self._get_name(d[config.id_field])})
        .style("font-size", "0.8em")
        .style("font-weight", "bold")
        .style("fill", self.cs.dark_text_color)
        //.style("fill", "white")
        .on("click", self._bar_click.bind(this));

    //check if data is available and add change graph
    if(controller.data_period.length == 0) {
        this._label.text("NA")
    } else {
        this._label.text(function(d, i){return self._get_name(d[config.id_field])})
    }

    var format = d3.format("1g")

    this._label_value = this._chart_left.selectAll(".value text")
        .data(data);

    this._label_value.enter().append("text")
        .attr("class", "name text clickable")
        .attr("x", self.width)
        .attr("y", function (d, i) {return (self.y(d[config.name_field]) + self.y(d[config.name_field]) + self.y.rangeBand()) / 2})
        .attr("dy", "0.4em")
        .text(function(d, i){return d[config.value_field].toFixed(0)})
        .style("text-anchor", "end")
        .style("font-size", "0.8em")
        .style("font-weight", "bold")
        .style("fill", self.cs.dark_text_color)
        //.style("fill", "white")
        .on("click", self._bar_click.bind(this));


};

BarGraph.prototype._draw_header = function(){

    var self = this;

    var state = controller.state;

    this._header  = this._chart_left.append("text")
        .attr("x", "0em")
        .attr("y", -21 )
        .attr("dy", "0em")
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", "white")
        .text( controller.config.areaTypeMapping[state.areaType] + ": " + controller.config.indicatorLabels[state.indicator]);


};



BarGraph.prototype._bindEvents = function(){

    ee.addListener('period_change', this._period_change_listener.bind(this));
    ee.addListener('area_change', this._area_change_listener.bind(this));

};


/*----------------transitions------------------*/

BarGraph.prototype._area_change_listener = function() {

    var self = this;
    var config = this.config;
    var state = controller.state;


    self._bars
        .data(self.data_period)
        .transition()
        .duration(500)
        .style("fill", function(d){ return self._select_color(d)});

    self._background_bars_left
        .data(self.data_period)
        .transition()
        .duration(500)
        .style("fill", function(d){ return self._select_color(d)});



};

BarGraph.prototype._period_change_listener = function() {

    var self = this;
    var config = this.config;
    var state = controller.state;


    //check if data is available and add change graph
    if(controller.data_period.length == 0) {

        self._bars
            .data(self.data_period)
            .transition()
            .duration(750)
            .attr("width", 0);

        self._label_value
            .data(self.data_period)
            .transition()
            .duration(750)
            .text("NA")

    } else {

        self.data_period = controller.data_period;
        self.data_period.sort(self._sort_y("alpha"));
        self.x.domain([0, d3.max(self.data_period, function (d) {return self.validate_NaN_to_0(d[config.value_field]);})]);

        self._bars
            .data(self.data_period)
            .transition()
            .duration(750)
            .attr("width", function (d, i) {return self.x(self.validate_NaN_to_0(d[config.value_field]))});

        self._label_value
            .data(self.data_period)
            .transition()
            .duration(750)
            .text(function(d, i){return d[config.value_field].toFixed(0)})

    }



    //self._chart_right
    //    .transition()
    //    .select(".x.axis")
    //    .duration(750)
    //    .call(this.xAxis_right);




};





/*---------------functions---------------------*/


BarGraph.prototype._get_name = function(id){

    var state = controller.state;

    return controller.config.areaList[state.areaType].filter(function(d){
        if(d.id == id){return d}
    })[0].short_name;

};


BarGraph.prototype._select_color = function(d){

    var config = this.config;
    var state = controller.state;
    var self = this;

    if(d[config.id_field] == state.current_area){ //config file;
        return self.cs.highlight_color
    } else {
        return self.cs.main_color_offset
    }

};

BarGraph.prototype._bar_click = function(d){

    var config = this.config;
    controller._area_change(d[config.id_field]);

};





