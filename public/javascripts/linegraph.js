function LineGraph(config, indicator) {
    this._config = config;
    this.indicator = indicator;

}

LineGraph.prototype._init = function(){



    console.log("init line graph");
    this.data = controller._data;
    this._dataNest = this._nestData(this.data);

    this._build_graph();
    this._set_scales();
    this._draw_axes();
    this._draw_lines();
    this._draw_points();

};



LineGraph.prototype._build_graph = function(){


    var config = this._config;

    var full_width = parseInt(d3.select(config.container_id).style("width"), 10);
    var full_height = Math.max(full_width /2, 400);


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


 LineGraph.prototype._set_scales = function(){

 var self = this;
 var config = this._config;

 //config.margin.left = 50;

 this.x = d3.scale.linear().range([0, this.width]);
 this.y = d3.scale.linear().range([0, this.height]);


 //calcualate constant origin shift
 this._period_arr = this._list(data, config.x_field);
 var origin_shift_x = 10;
 var tick_width = self.width / (this._period_arr.length - 1);

 this.x.domain([-(origin_shift_x/tick_width), this._period_arr.length - 1]);
 this.y.domain([d3.max(this._list(data, config.y_field)), 0]);

 };

 LineGraph.prototype._draw_axes = function(){

     var config = this._config;
     var self = this;

     this.xAxis = d3.svg.axis()
         .scale(this.x)
         .orient("bottom")
         .outerTickSize(0)
         //.tickFormat(function(d){console.log(d)})
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
         .call(this.xAxis);

     this._chart.append("g")
         .attr("class", "y axis")
         //.attr("transform", "translate(0, 0)")
         .call(this.yAxis);

    this._chart.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "start")
        .attr("x", -25)
        .attr("y", -20)
        .text(controller._config.indicatorLabels[this.indicator]);

};


LineGraph.prototype._draw_lines = function(){

    var config = this._config;
    var self = this;

    var data = this._data;
    var dataNest = this._dataNest;

    // Define the line
    var line = d3.svg.line()
        .defined(function(d) {return !isNaN(d[config.y_field]); })
        .x(function(d, i) {return self.x(i);})
        .y(function(d) {return self.y(d[config.y_field]);});



    dataNest.forEach(function(d, i){
        var lines = self._chart.append("path")
            .attr("class", "line")
            .attr("id", "line" + d.key) // assign ID
            .attr("d", line(d.values))
            .style("stroke", "lightsteelblue")
            .style("stroke-width", 1)
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
            .attr("r", 2)
            .attr("cx", function(d, i){return self.x(i)})
            .attr("cy", function(d){return self.y(d.Value)})
            .style("fill", "lightsteelblue")
            .style("stroke", "white")
            .style("stroke-width", 1);


    });


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

LineGraph.prototype._nestData = function(data){
    var self = this;
    return d3.nest()
        .key(function(d){return d[self._config.id_field]})
        .entries(data);
};