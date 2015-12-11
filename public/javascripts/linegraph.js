function LineGraph(config) {

    this.config = config;
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
    this._draw_density_line();
    this._draw_header();

    this._bindEvents();

};


LineGraph.prototype._build_graph = function(){

    validate_NaN_to_0 = this.validate_NaN_to_0;


    var config = this.config;

    var full_width = 500;
    var full_height = 250;


    //var full_width = parseInt(d3.select(config.container_id).style("width"), 10);
    //var full_height = parseInt(d3.select(config.container_id).style("height"), 10);
    //var full_height = full_width/2;

    //config.margin.left = Math.max(100, full_width /4);  //here
    //config.margin.left = 300

    config.middle = full_width / 2;

    config.margin.middle = config.margin.left / 4;

    this.width =  config.middle - config.margin.left  - config.margin.middle;
    this.height = full_height - config.margin.bottom - config.margin.top;

    //console.log(this.width + " x " + this.height)


    //this._svg = d3.select(config.container_id)
    //    .append("svg")
    //    .attr("class", "widget")
    //    .attr("width", full_width)
    //    .attr("height", full_height);

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


 LineGraph.prototype._set_scales = function(){

 var self = this;
 var config = this.config;

 //config.margin.left = 50;

 //calcualate constant origin shift
 this._period_arr = this._list(self.data, config.x_field);
 var origin_shift_xLine = 10;

 var tick_width_xLine = self.width / (this._period_arr.length - 1);

 //var tick_width_xDensity =  d3.max(self.density_data, function(d) { return +d["density"]})/ config.margin.middle ;
 //var origin_shift_xDensity = 50;



 this.xLine = d3.scale.linear()
     .range([config.margin.middle, this.width])
     .domain([-(origin_shift_xLine/tick_width_xLine), this._period_arr.length - 1]);

 this.xDensity = d3.scale.linear()
     .range([this.width - config.margin.middle * 4, 0.1 * this.width])
     .domain([0, d3.max(self.density_data, function(d) { return +d["density"]})]) //??"density" should be in config file


 this.y = d3.scale.linear()
     .range([0, this.height])
     .domain([ d3.max(self.density_data, function(d) { return +d["x"]}), 0]);//??"x" should be in config file (density graph sideways so y is called x)

 };



 LineGraph.prototype._draw_axes = function(){

     var config = this.config;
     var self = this;

     this.xAxisLine = d3.svg.axis()
         .scale(this.xLine)
         .orient("bottom")
         .outerTickSize(0)
         .tickFormat(function(d, i){
             if(d === parseInt(d, 10)){ //we can only map intergers to time periods otherwise return blank
                 return self._period_arr[d]
             } else {
                 return ""
             }})
         .ticks(Math.max(5, Math.ceil(self._period_arr.length/2))); //set min 5 ticks otherwise every other???




     this.yAxis = d3.svg.axis()
         .scale(this.y)
         .orient("left")
         .outerTickSize(0);


     this._chart_right.append("g")
         .attr("class", "x axis")
         .attr("transform", "translate(0," + this.height + ")")
         .call(this.xAxisLine);


     this._chart_right.append("g")
         .attr("class", "y axis")
         .attr("transform", "translate(" + config.margin.middle +  ", 0)")
         .call(this.yAxis);

     this._chart_right.append("text")
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
        .x(function(d, i) {return self.xLine(i);})
        .y(function(d) {return self.y(d[config.y_field]);});


    this.dataNest.forEach(function(d, i){

        var id = d.key

        var lines = self._chart_right.append("path")
            .attr("class", "line timeLine")
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

        var dots = self._chart_right.selectAll(".timeDot")
            .data(d.values)
            .enter()
            .append("circle")
            .attr("class", "dots" + d.key)
            .attr("id", "timeDots" + d.key)
            .attr("cx", function(e, i){return self.xLine(i)})
            .attr("cy", function(e){return self.y(e[config.y_field])})
            .style("stroke", "#003da5") //??from config
            .attr("r", function(){return self._select_dot_radius(d.key)})
            .style("stroke-width", function(){return self._select_dot_stroke_width(d.key)})
            .style("fill", function(){return self._select_color(d.key)})
            .on("click", self._dot_click.bind(self));
    });

    d3.selectAll(".dots" + state.current_area).moveToFront();


};

LineGraph.prototype._draw_density_line = function(){

    var self = this;
    var config = this.config;
    var data = this.data;
    //var densityDataNest = this.densityDataNest;

    var state = controller.state;

    //var year = controller._current_period;
    var densityArray;
    this.densityDataNest.forEach(function(d, i){
        if(d.key == state.current_period){
            densityArray = d.values;
        }
     });

    this.fArea = d3.svg.area()
        .y(function(d) { return self.y(d.x); })
        .x0(function(d) { return self.xDensity(0) })
        .x1(function(d) { return self.xDensity(d.density); })
        .interpolate("linear");

    //var fLine = d3.svg.line()
    //    .y(function(d) { return self.y(d.x); })
    //    .x(function(d) { return self.xDensity(d.density); })
    //    .interpolate("linear");

    this._dist_area = this._chart_left
        .datum(densityArray)
        .append("path")
        .attr("class", "densityArea")
        .attr("d", this.fArea)
        //.style("fill", "#BFD8BD");

    //var dist_path = this._chart_left
    //    .append("path")
    //    .datum(densityArray)
    //    .attr("class", "desnsityLine")
    //    .attr("d", fLine)
    //    //.style("stroke", "#BFD8BD")
    //    //.style("stroke-width", 1)
    //    .style("fill", "none")
    //    //.style("fill", "lightsteelblue")




};

LineGraph.prototype._draw_header = function(){

    this._header  = this._chart_left.append("text")
        .attr("x", "0em")
        .attr("y", "-2.5em" )
        .attr("dy", "2em")
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", "white")
        .text("Distribution in England");

    this._header  = this._chart_right.append("text")
        .attr("x", "0em")
        .attr("y", "-2.5em" )
        .attr("dy", "2em")
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", "white")
        .text("Change over time");

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
        var lines = self._chart_right.select("#line" + d.key)
            .transition()
            .duration(750)
            .style("stroke", function(){return self._select_color(d.key)})
            .style("stroke-width", function(){return self._select_line_stroke_width(d.key)})

    });

    this.dataNest.forEach(function(d, i){
        var dots = self._chart_right.selectAll(".dots" + d.key)
            .transition()
            .duration(750)
            .attr("r", function(){return self._select_dot_radius(d.key)})
            .style("stroke-width", function(){return self._select_dot_stroke_width(d.key)})
            .style("fill", function(){return self._select_color(d.key)});
    });


};


LineGraph.prototype._period_change_listener = function() {

    var state = controller.state;

    var densityArray;
    this.densityDataNest.forEach(function(d, i){
        if(d.key == state.current_period){
            densityArray = d.values;
        }
    });

    this._dist_area
        .datum(densityArray)
        .transition()
        .duration(750)
        .attr("d", this.fArea);

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
    var state = controller.state;
    if(id == state.current_area){ //colors in config file;
        return "#9b26b6"
    } else {
        return "#ffe166"
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


LineGraph.prototype._line_click = function(self, id){

    //var self = this;

    console.log(id)

    var config = self.config;
    controller._area_change(id);

};

LineGraph.prototype._dot_click = function(d){

    //var self = this;

    console.log(d)

    var config = this.config;
    controller._area_change(d[config.id_field]);

};