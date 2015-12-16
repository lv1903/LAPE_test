function DensityGraph(config, objAverages) {

    //takes config file and array of form [{name:NAME, year1:median, .... , yearn:median}, ...]
    //all averages are plotted on widget with name and average_value
    //only works for two averages

    this.config = config;
    this.averages = objAverages;
    this.cs = controller.config.colorScheme;
    this._init();

}

DensityGraph.prototype._init = function(){

    console.log("init density graph");

    //console.log(this.config)

    this.data = controller.data;
    this.dataNest = this._nestData(this.data, this.config.id_field);

    this.density_data = controller.density_data;
    this.densityDataNest = this._nestData(this.density_data, this.config.x_field);

    this._build_graph();
    this._set_scales();
    this._draw_axes();
    this._draw_density_line();
    this._draw_averages();
    this._draw_header();

    this._bindEvents();

};


DensityGraph.prototype._build_graph = function(){

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


DensityGraph.prototype._set_scales = function(){

    var self = this;
    var config = this.config;

    this.x = d3.scale.linear()
        .range([0, this.height])
        //.domain([0, d3.max(self.density_data, function(d) { return +d["x"]})]);//??"x" should be in config file
        .domain([0, self.densityDataNest[0].values.length]);

    this.y = d3.scale.linear()
        .range([this.height, this.height / 2])
        .domain([0, d3.max(self.density_data, function(d) { return +d["density"]})]); //??"density" should be in config file

    //console.log(this.y(d3.max(self.density_data, function(d) { return +d["density"]})))

};



DensityGraph.prototype._draw_axes = function(){

    var config = this.config;
    var self = this;
    var state = controller.state;

    this.xAxis = d3.svg.axis()
        .scale(this.x)
        .orient("bottom")
        .tickFormat(d3.format("1g"))
        .outerTickSize(0)
        .ticks(2);



    this._chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis);

    this._chart.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "end")
        .attr("x", this.width - 20)
        .attr("y", this.height + 40)
        .text(controller.config.indicatorLabels[state.indicator]);

};


DensityGraph.prototype._draw_density_line = function(){

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
        .x(function(d) { return self.x(d.x); })
        .y0(function(d) { return self.y(0) })
        .y1(function(d) { return self.y(d.density); })
        .interpolate("monotone");

    this._dist_area = this._chart
        .datum(densityArray)
        .append("path")
        .attr("class", "densityArea")
        .attr("d", this.fArea)
        .style("fill", self.cs.main_color);

};


DensityGraph.prototype._draw_averages = function(){

    var self = this;

    var y = this.height/2;
    var text_anchor = "end"

    this.averages.sort(
        function (a, b) {
            return a[controller.state.current_period] - b[controller.state.current_period];
        }
    );

    for(i in self.averages){

        var name = self.averages[i].name;
        var median = self.averages[i][controller.state.current_period];

        //console.log(self.x(median))

        //shift text up
        y -= 30;

        self._chart.append("line")
            .attr("class", "average_line_" + name)
            .attr("x1", self.x(median))
            .attr("x2", self.x(median))
            .attr("y1", self.height)
            .attr("y2", y)
            .style("stroke-width", 2)
            .style("stroke", "white")
            .style("fill", "none");


        this._chart.append("text")
            .attr("class", "average_text_" + name)
            .attr("text-anchor", text_anchor)
            .attr("x", function(){
                if(text_anchor == "end"){
                    return self.x(median) - 5
                } else {
                    return self.x(median) + 5
                }
            })
            .attr("y", y)
            .attr("dy", "0.8em")
            .style("fill", "white")
            .text(name);


        this._chart.append("text")
            .attr("class", "average_value_" + name)
            .attr("text-anchor", text_anchor)
            .attr("x", function(){
                if(text_anchor == "end"){
                    return self.x(median) - 10
                } else {
                    return self.x(median) + 10
                }
            })
            .attr("y", y)
            .attr("dy", "1.8em")
            .style("fill", "white")
            .style("font-size", "1.5em")
            .text(Math.round(median));


        //alternate text direction
        if(text_anchor == "end"){
            text_anchor = "start";
        } else {
            text_anchor = "end";
        };
    }
}


DensityGraph.prototype._draw_header = function(){

    this._header  = this._chart.append("text")
        .attr("x", "0em")
        .attr("y", "0em" )
        .attr("dy", "0em")
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", "white")
        .text("Distribution in England");

};





DensityGraph.prototype._bindEvents = function(){

    ee.addListener('period_change', this._period_change_listener.bind(this));
    //ee.addListener('area_change', this._area_change_listener.bind(this));

};


/*------------------transitions---------------------*/

DensityGraph.prototype._area_change_listener = function() {

    //var self = this;
    //var state = controller.state;
    //
    //d3.select("#line" + state.current_area).moveToFront();
    //d3.selectAll(".dots" + state.current_area).moveToFront();
    //
    //
    //this.dataNest.forEach(function(d, i){
    //    var lines = self._chart.select("#line" + d.key)
    //        .transition()
    //        .duration(750)
    //        .style("stroke", function(){return self._select_color(d.key)})
    //        .style("stroke-width", function(){return self._select_line_stroke_width(d.key)})
    //
    //});
    //
    //this.dataNest.forEach(function(d, i){
    //    var dots = self._chart_right.selectAll(".dots" + d.key)
    //        .transition()
    //        .duration(750)
    //        .attr("r", function(){return self._select_dot_radius(d.key)})
    //        .style("stroke-width", function(){return self._select_dot_stroke_width(d.key)})
    //        .style("fill", function(){return self._select_color(d.key)});
    //});


};


DensityGraph.prototype._period_change_listener = function() {

    var state = controller.state;
    var self = this;

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

    var text_anchor = "end"
    for(i in self.averages){

        var name = self.averages[i].name;
        var median = self.averages[i][controller.state.current_period];

        d3.select(".average_line_" + name)
            .transition()
            .duration(1000)
            .attr("x1", self.x(median))
            .attr("x2", self.x(median))



        d3.select(".average_text_" + name)
            .transition()
            .duration(1000)
            .attr("x", function(){
                if(text_anchor == "end"){
                    return self.x(median) - 5
                } else {
                    return self.x(median) + 5
                }
            });



        d3.select(".average_value_" + name)
            .transition()
            .duration(1000)
            .attr("x", function(){
                if(text_anchor == "end"){
                    return self.x(median) - 10
                } else {
                    return self.x(median) + 10
                }
            })
            .text(Math.round(median));

        //alternate text direction
        if(text_anchor == "end"){
            text_anchor = "start";
        } else {
            text_anchor = "end";
        };

    }





};

/*----------functions--------------------*/


DensityGraph.prototype.validate_NaN_to_0 = function(val){
    if(isNaN(val)) return 0; else return Number(val);
};

DensityGraph.prototype._list = function(data, key){
    var arr =[];
    for(var i in data) {
        var prop = data[i][key];
        if(arr.indexOf(prop) == -1){
            arr.push(prop)
        }
    }
    return arr;
};

DensityGraph.prototype._nestData = function(data, nestField){
    var self = this;
    return d3.nest()
        .key(function(d){return d[nestField]})
        .entries(data);
};




DensityGraph.prototype._select_color = function(id){
    var self = this;
    var state = controller.state;
    if(id == state.current_area){ //colors in config file;
        return self.cs.highlight_color
    } else {
        return self.cs.main_color_offset
    }
};

DensityGraph.prototype._select_line_stroke_width = function(id){
    var state = controller.state;
    if(id == state.current_area){ //colors in config file;
        return 4
    } else {
        return 2
    }
};

DensityGraph.prototype._select_dot_stroke_width = function(id){
    var state = controller.state;
    if(id == state.current_area){ //colors in config file;
        return 2
    } else {
        return 1
    }
};

DensityGraph.prototype._select_dot_radius = function(id){
    var state = controller.state;
    if(id == state.current_area){ //colors in config file;
        return 5
    } else {
        return 4
    }
};


//d3.selection.prototype.moveToBack = function() {
//    return this.each(function() {
//        var firstChild = this.parentNode.firstChild;
//        if (firstChild) {
//            this.parentNode.insertBefore(this, firstChild);
//        }
//    });
//};
//
//d3.selection.prototype.moveToFront = function() {
//    return this.each(function(){
//        this.parentNode.appendChild(this);
//    });
//};


//DensityGraph.prototype._line_click = function(self, id){
//
//    var config = self.config;
//    controller._area_change(id);
//
//};

//DensityGraph.prototype._dot_click = function(d){
//
//    var config = this.config;
//
//    controller._area_change(d[config.id_field]);
//
//
//};