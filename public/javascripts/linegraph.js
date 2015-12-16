function LineGraph(config) {

    this.config = config;
    this.cs = controller.config.colorScheme;
    this._init();

}

LineGraph.prototype._init = function(){

    console.log("init line graph");

    this.data = controller.data;
    this.dataNest = this._nestData(this.data, this.config.id_field);

    this.density_data = controller.density_data;
    this.densityDataNest = this._nestData(this.density_data, this.config.x_field);

    this._build_graph();
    this._set_scales();
    this._draw_axes();
    this._draw_lines();
    this._draw_points();
    this._draw_header();
    this._draw_time_vertical();

    this._bindEvents();

};


LineGraph.prototype._build_graph = function(){

    validate_NaN_to_0 = this.validate_NaN_to_0;


    var config = this.config;

    var full_width = 300;
    var full_height = 300;


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


 LineGraph.prototype._set_scales = function(){

 var self = this;
 var config = this.config;

 var max_y_value = d3.max(self.data, function(d) { return d[config.y_field]});
 var max_y_value_width = String(max_y_value.toFixed(0)).length * 10


console.log("*******")
 console.log(max_y_value)
 console.log(max_y_value_width)

 //calcualate constant origin shift
 this._period_arr = this._list(self.data, config.x_field);
 var origin_shift_x = max_y_value_width;

 var tick_width_x = self.width / (this._period_arr.length - 1);

 this.x = d3.scale.linear()
     .range([0, this.width])
     .domain([-(origin_shift_x/tick_width_x), this._period_arr.length - 1]);
     //.domain([-max_y_value_width, this._period_arr.length - 1])



 this.y = d3.scale.linear()
     .range([0, this.height])
     .domain([ d3.max(self.data, function(d) { return d[config.y_field]}) * 1.25, 0]);//??"x" should be in config file (density graph sideways so y is called x)

 };



 LineGraph.prototype._draw_axes = function(){

     var config = this.config;
     var self = this;

     this.xAxisLine = d3.svg.axis()
         .scale(this.x)
         .orient("bottom")
         .outerTickSize(0)
         .tickFormat(function(d, i){
             if(d === parseInt(d, 10)){ //we can only map intergers to time periods otherwise return blank
                 return self._period_arr[d]
             } else {
                 return ""
             }})
         .ticks(Math.max(5, Math.ceil(self._period_arr.length/2))); //set max 5 ticks otherwise every other???




     this.yAxis = d3.svg.axis()
         .scale(this.y)
         .orient("left")
         .tickFormat(d3.format("1g"))
         .outerTickSize(0)
         .ticks(5);



     this._chart.append("g")
         .attr("class", "x axis")
         .attr("transform", "translate(0," + this.height + ")")
         .call(this.xAxisLine);



     var max_y_value = d3.max(self.data, function(d) { return d[config.y_field]});
     var max_y_value_width = String(max_y_value.toFixed(0)).length * 10

     this._chart.append("g")
         .attr("class", "y axis")
         .attr("transform", "translate("  + max_y_value_width / 2 + ", 0)")
         .call(this.yAxis);

     this._chart.append("text")
         .attr("class", "x-label")
         .attr("text-anchor", "end")
         .attr("x", this.width - 20)
         .attr("y", this.height + 40)
         .text("Year");

};


LineGraph.prototype._draw_lines = function(){

    var config = this.config;
    var self = this;
    var state = controller.state;


    // Define the line
    var fLine = d3.svg.line()
        .defined(function(d) {return !isNaN(d[config.y_field]); })
        .x(function(d, i) {return self.x(i);})
        .y(function(d) {return self.y(d[config.y_field]);});
        //.interpolate("monotone");


    this.dataNest.forEach(function(d, i){

        var id = d.key

        var lines = self._chart.append("path")
            .attr("class", "line timeLine clickable")
            .attr("id", "line" + d.key) // assign ID
            .attr("d", fLine(d.values))
            .style("stroke", function(){return self._select_color(d.key)})
            .style("stroke-width", function(){return self._select_line_stroke_width(d.key)})
            .style("fill", "none")
            .on("click", function() { self._line_click(self, d.key)});
    });

    d3.select("#line" + state.current_area).moveToFront();

};

LineGraph.prototype._draw_points = function(){
    var self = this;
    var config = this.config;
    var state = controller.state;

    this.dataNest.forEach(function(d, i){

        var dots = self._chart.selectAll(".timeDot")
            .data(d.values)
            .enter()
            .append("circle")
            .attr("class", "dots" + d.key + " clickable")
            .attr("id", "timeDots" + d.key)
            .attr("cx", function(e, i){return self.x(i)})
            .attr("cy", function(e){return self.y(e[config.y_field])})
            .style("stroke", self.cs.background_color)
            .attr("r", function(){return self._select_dot_radius(d.key)})
            .style("stroke-width", function(){return self._select_dot_stroke_width(d.key)})
            .style("fill", function(){return self._select_color(d.key)})
            .on("click", self._dot_click.bind(self));
    });

    d3.selectAll(".dots" + state.current_area).moveToFront();


};



LineGraph.prototype._draw_header = function(){

    this._header  = this._chart.append("text")
        .attr("x", "0em")
        .attr("y", "-2.5em" )
        .attr("dy", "2em")
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", "white")
        .text("Change over time");

};

LineGraph.prototype._draw_time_vertical = function(){
    var self = this;
    var config = this.config;
    var state = controller.state;

    console.log(self._period_arr.indexOf(state.current_period))

    self._vertical_line = self._chart.append("line")
        .attr("class", "line verticalTimeLine")
        .attr("x1", self.x(self._period_arr.indexOf(state.current_period)))
        .attr("x2", self.x(self._period_arr.indexOf(state.current_period)))
        .attr("y1", self.height)
        .attr("y2", self.height * 0.1)
        .style("stroke-width", 2)
        .style("stroke", "white")
        .style("fill", "none");

    self._vertical_line.moveToBack();


};





LineGraph.prototype._bindEvents = function(){

    ee.addListener('period_change', this._period_change_listener.bind(this));
    ee.addListener('area_change', this._area_change_listener.bind(this));

};


/*------------------transitions---------------------*/

LineGraph.prototype._area_change_listener = function() {

    var self = this;
    var state = controller.state;

    d3.select("#line" + state.current_area).moveToFront();
    d3.selectAll(".dots" + state.current_area).moveToFront();


    this.dataNest.forEach(function(d, i){
        var lines = self._chart.select("#line" + d.key)
            .transition()
            .duration(750)
            .style("stroke", function(){return self._select_color(d.key)})
            .style("stroke-width", function(){return self._select_line_stroke_width(d.key)})

    });

    this.dataNest.forEach(function(d, i){
        var dots = self._chart.selectAll(".dots" + d.key)
            .transition()
            .duration(750)
            .attr("r", function(){return self._select_dot_radius(d.key)})
            .style("stroke-width", function(){return self._select_dot_stroke_width(d.key)})
            .style("fill", function(){return self._select_color(d.key)});
    });


};


LineGraph.prototype._period_change_listener = function() {

    var state = controller.state;
    var self = this;
    var state = controller.state;
    var config = this.config;

    self._vertical_line
        .transition()
        .duration(500)
        .ease("exp")
        .attr("x1", self.x(self._period_arr.indexOf(state.current_period)))
        .attr("x2", self.x(self._period_arr.indexOf(state.current_period)))


};

/*----------functions--------------------*/


LineGraph.prototype.validate_NaN_to_0 = function(val){
    if(isNaN(val)) return 0; else return Number(val);
};

LineGraph.prototype._list = function(data, key){
    var arr =[];
    for(var i in data) {
        var prop = data[i][key];
        if(arr.indexOf(prop) == -1){
            arr.push(prop)
        }
    }
    return arr;
};

LineGraph.prototype._nestData = function(data, nestField){
    var self = this;
    return d3.nest()
        .key(function(d){return d[nestField]})
        .entries(data);
};




LineGraph.prototype._select_color = function(id){
    var self = this;
    var state = controller.state;
    if(id == state.current_area){ //colors in config file;
        return self.cs.highlight_color
    } else {
        return self.cs.main_color_offset
    }
};

LineGraph.prototype._select_line_stroke_width = function(id){
    var state = controller.state;
    if(id == state.current_area){ //colors in config file;
        return 4
    } else {
        return 2
    }
};

LineGraph.prototype._select_dot_stroke_width = function(id){
    var state = controller.state;
    if(id == state.current_area){ //colors in config file;
        return 2
    } else {
        return 1
    }
};

LineGraph.prototype._select_dot_radius = function(id){
    var state = controller.state;
    if(id == state.current_area){ //colors in config file;
        return 5
    } else {
        return 4
    }
};





LineGraph.prototype._line_click = function(self, id){

    var config = self.config;
    controller._area_change(id);

};

LineGraph.prototype._dot_click = function(d){
    var config = this.config;
    controller._time_slider_change(d[config.x_field]);
    controller._area_change(d[config.id_field]);

};