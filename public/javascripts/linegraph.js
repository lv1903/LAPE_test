function LineGraph(config, indicator) {
    this._config = config;
    this.indicator = indicator;

}

LineGraph.prototype._init = function(){



    console.log("init line graph");

    this.data = controller._data;
    this._dataNest = this._nestData(this.data, this._config.id_field);

    this.density_data = controller.density_data;
    this._densityDataNest = this._nestData(this.density_data, this._config.x_field);

    //console.log(this._densityDataNest)

    //console.log(this._dataNest)//["E38000045"])

    this._build_graph();
    this._set_scales();
    this._draw_axes();
    this._draw_lines();
    this._draw_points();
    this._draw_density_line();

};



LineGraph.prototype._build_graph = function(){


    var config = this._config;

    var full_width = parseInt(d3.select(config.container_id).style("width"), 10);
    //var full_height = parseInt(d3.select(config.container_id).style("height"), 10);
    var full_height = Math.max(2*full_width/5, 400);


    this.width =  full_width - config.margin.left - config.margin.right;
    this.height = full_height - config.margin.bottom - config.margin.top;

    config.margin.middle = config.margin.left + this.width /3;

    //console.log(this.width + " x " + this.height)


    this._svg = d3.select(config.container_id)
        .append("svg")
        .attr("class", "widget")
        .attr("width", full_width)
        .attr("height", full_height);

    this._chart = this._svg
        .append('g')
        .attr("transform", "translate(" + (config.margin.left)  +  "," + config.margin.top + ")");




};


 LineGraph.prototype._set_scales = function(){

 var self = this;
 var config = this._config;

 //config.margin.left = 50;

 //calcualate constant origin shift
 this._period_arr = this._list(data, config.x_field);
 var origin_shift_xLine = 10;
 var origin_shift_xDensity = 2;
 var tick_width = self.width / (this._period_arr.length - 1);


 this.xLine = d3.scale.linear()
     .range([config.margin.middle, this.width])
     .domain([-(origin_shift_xLine/tick_width), this._period_arr.length - 1]);

     //console.log("densityMax")
     //console.log(d3.max(self.density_data, function(d) { return +d["density"]}))

 this.xDensity = d3.scale.linear()
     .range([config.margin.middle, 0])
     .domain([-(origin_shift_xDensity/tick_width), d3.max(self.density_data, function(d) { return +d["density"]})]) //??"density" should be in config file
     //.domain([0, d3.max(self.density_data, function(d) { return +d["density"]})]) //??"density" should be in config file

    //console.log(config.margin.middle + " " + this.xDensity(0.107))
    //console.log(config.margin.middle + " " + this.xDensity(0))



 this.y = d3.scale.linear()
     .range([0, this.height])
     .domain([ d3.max(self.density_data, function(d) { return +d["x"]}), 0]);//??"x" should be in config file (density graph sideways so y is called x)


 };



 LineGraph.prototype._draw_axes = function(){

     var config = this._config;
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


     this._chart.append("g")
         .attr("class", "x axis")
         .attr("transform", "translate(0," + this.height + ")")
         .call(this.xAxisLine);


     this._chart.append("g")
         .attr("class", "y axis")
         .attr("transform", "translate(" + config.margin.middle +  ", 0)")
         .call(this.yAxis);

    this._chart.append("text")
         .attr("class", "x-label")
         .attr("text-anchor", "start")
         .attr("x", config.margin.middle)
         .attr("y", -20)
         .text(controller._config.indicatorLabels[this.indicator]);

    this._chart.append("text")
         .attr("class", "x-label")
         .attr("text-anchor", "start")
         .attr("x", 0)
         .attr("y", this.height)
         .text("Distribution in England");

};


LineGraph.prototype._draw_lines = function(){

    var config = this._config;
    var self = this;

    var data = this._data;
    var dataNest = this._dataNest;

    // Define the line
    var line = d3.svg.line()
        .defined(function(d) {return !isNaN(d[config.y_field]); })
        .x(function(d, i) {return self.xLine(i);})
        .y(function(d) {return self.y(d[config.y_field]);});


    dataNest.forEach(function(d, i){
        var lines = self._chart.append("path")
            .attr("class", "line")
            .attr("id", "line" + d.key) // assign ID
            .attr("d", line(d.values))
            .style("stroke", "lightsteelblue")
            .style("stroke-width", 2)
            .style("fill", "none");
    });
};

LineGraph.prototype._draw_points = function(){
    var self = this
    var config = this._config;
    var data = this._data;
    var dataNest = this._dataNest;

    dataNest.forEach(function(d, i){
        dots = self._chart.selectAll(".dot")
            .data(d.values)
            .enter()
            .append("circle")
            .attr("class", "dot" + d.key)
            .attr("r", 3)
            .attr("cx", function(d, i){return self.xLine(i)})
            .attr("cy", function(d){return self.y(d.Value)})//??from config
            .style("fill", "lightsteelblue")
            .style("stroke", "white")
            .style("stroke-width", 1);
    });
};

LineGraph.prototype._draw_density_line = function(){
    var self = this
    var config = this._config;
    var data = this._data;
    var densityDataNest = this._densityDataNest;
    var year = controller._current_period;
    var densityArray;
    densityDataNest.forEach(function(d, i){
        if(d.key == year){
            densityArray = d.values;
        }
     });


    ////plotting functions
    //var fArea = d3.svg.area()
    //    .y(function(d) { return self.y(d[0]); })
    //    .x0(0)
    //    .x1(function(d) { return self.xDensoty(d[1]) - 2; })
    //    .interpolate("monotone");

    var fArea = d3.svg.area()
        .y(function(d) { return self.y(d.x); })
        .x0(function(d) { return self.xDensity(0) })
        .x1(function(d) { return self.xDensity(d.density); })
        .interpolate("monotone");

    var fLine = d3.svg.line()
        .y(function(d) { return self.y(d.x); })
        .x(function(d) { return self.xDensity(d.density); })
        .interpolate("linear");

    var dist_area = this._chart
        .append("path")
        .datum(densityArray)
        .attr("class", "densityArea")
        .attr("d", fArea)
        .style("fill", "lightsteelblue");

    var dist_path = this._chart
        .append("path")
        .datum(densityArray)
        .attr("class", "desnsityLine")
        .attr("d", fLine)
        .style("stroke", "lightsteelblue")
        .style("stroke-width", 1)
        .style("fill", "none")
        //.style("fill", "lightsteelblue")




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