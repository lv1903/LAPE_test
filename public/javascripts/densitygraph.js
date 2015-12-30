function DensityGraph(config) {

    //takes config file and array of form [{name:NAME, year1:median, .... , yearn:median}, ...]
    //all averages are plotted on widget with name and average_value
    //only works for two averages

    this.config = config;
    this.averages = this._getAverages();
    this.previous_averages = this.averages;

    this.cs = controller.config.colorScheme;
    this._init();

}

DensityGraph.prototype._init = function(){

    var state = controller.state;

    var areaType = state.areaType;
    var indicator = state.indicator;
    var genderType = state.genderType;

    console.log("init density graph");

    //console.log(this.config)

    //this.data = controller.data;
    this.dataNest = this._nestData(controller[areaType][indicator][genderType].data, this.config.id_field);

    //this.density_data = controller.density_data;
    this.densityDataNest = this._nestData(controller[areaType][indicator][genderType].density_data, this.config.x_field);

    this._draw_all();

    this._bindEvents();

};

DensityGraph.prototype._draw_all= function(){

    this._build_graph();
    this._add_help_button();
    this._set_scales();
    this._draw_axes();
    this._draw_density_line();
    this._draw_averages();
    this._draw_header();

}


DensityGraph.prototype._build_graph = function(){

    validate_NaN_to_0 = this.validate_NaN_to_0;


    var config = this.config;

    config.full_width = 300;
    config.full_height = 400;

    var additional_margin_bottom = 14;

    this.width =  config.full_width - config.margin.left  - config.margin.right;
    this.height = config.full_height - config.margin.bottom - config.margin.top - additional_margin_bottom;

    this._svg = d3.select(config.container_id)
        .append("div")
        .classed("svg-container", true)
        .append("svg")
        .attr("class", "widget")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + config.full_width + " " + config.full_height )
        .classed("svg-content-responsive", true)

    this._chart = this._svg
        .append('g')
        .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")");




};

DensityGraph.prototype._set_scales = function(){

    var self = this;
    var config = this.config;
    var state = controller.state;

    var areaType = state.areaType;
    var indicator = state.indicator;
    var genderType = state.genderType;

    this.x = d3.scale.linear()
        .range([0, this.width])
        //.domain([0, d3.max(self.density_data, function(d) { return +d["x"]})]);//??"x" should be in config file
        .domain([0, self.densityDataNest[0].values.length]);

    this.y = d3.scale.linear()
        .range([this.height, this.height / 2])
        .domain([0, d3.max(controller[areaType][indicator][genderType].density_data, function(d) { return +d["density"]})]); //??"density" should be in config file

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

    var state = controller.state;

    var areaType = state.areaType;
    var indicator = state.indicator;
    var genderType = state.genderType;

    var data = controller[areaType][indicator][genderType].data;
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


DensityGraph.prototype._draw_averages = function() {

    var self = this;

    var y_arr = [this.height / 2, this.height / 2 - 110, this.height / 2 - 50];
    var text_anchor_arr = ["end", "start", "start"]


    this.averages.sort(
        function (a, b) {
            return a[controller.state.current_period] - b[controller.state.current_period];
        }
    );

    //console.log(self.averages)

    for (i in self.averages) {

        var name = self.averages[i].name.trim();

        if(name == "England"){
            id = "England"
        } else if(name == "Wessex"){
            id = "Wessex"
        }else {
            id = "Alt"
        }

        var median = self.averages[i][controller.state.current_period];

        this._chart.append("line")
            .attr("class", "average_line")
            .attr("id", "average_line_" + id)
            .attr("x1", self.x(median))
            .attr("x2", self.x(median))
            .attr("y1", self.height)
            .attr("y2", function(){return y_arr[i]})
            //.attr("y2", self.height)
            .style("stroke-width", 2)
            .style("stroke", "white")
            .style("fill", "none");


        this._chart.append("text")
            .attr("class", "average_text")
            .attr("id", "average_text_" + id)
            .attr("text-anchor", function () {
                return text_anchor_arr[i]
            })
            .attr("x", function () {
                var text_anchor = text_anchor_arr[i];
                if (text_anchor == "end") {
                    return self.x(median) - 5
                } else {
                    return self.x(median) + 5
                }
            })
            .attr("y", function () {
                return y_arr[i]
            })
            .attr("dy", "0.8em")
            .style("fill", function(){if(id == "Alt"){
                    return self.cs.highlight_color
                } else {
                    return "white"
                }
            })
            //.style("fill", self.cs.background_color)
            .text(name);


        this._chart.append("text")
            .attr("class", "average_value")
            .attr("id", "average_value_" + id)
            .attr("text-anchor", function () {
                return text_anchor_arr[i]
            })
            .attr("x", function () {
                var text_anchor = text_anchor_arr[i];
                if (text_anchor == "end") {
                    return self.x(median) - 10
                } else {
                    return self.x(median) + 10
                }
            })
            .attr("y", function () {
                return y_arr[i]
            })
            .attr("dy", "1.8em")
            .style("fill", function(){if(id == "Alt"){
                    return self.cs.highlight_color
                } else {
                    return "white"
                }
            })
            //.style("fill", self.cs.background_color)
            .style("font-size", "1.5em")
            .text(Math.round(median));


    }

};

DensityGraph.prototype._move_averages= function(){

    var self = this;

    var y_arr = [this.height / 2, this.height / 2 - 110, this.height / 2 - 50];
    var text_anchor_arr = ["end", "start", "start"];

    this.averages.sort(
        function (a, b) {
            return a[controller.state.current_period] - b[controller.state.current_period];
        }
    );

    for (i in self.averages) {

        var name = self.averages[i].name.trim();

        if(name == "England"){
            id = "England"
        } else if(name == "Wessex"){
            id = "Wessex"
        }else {
            id = "Alt"
        }

        var median = self.averages[i][controller.state.current_period];

        d3.select("#average_line_" + id)
            .transition()
            .duration(500)
            .attr("x1", self.x(median))
            .attr("x2", self.x(median))
            .attr("y1", self.height)
            .attr("y2", function () {
                return y_arr[i]
            })



        d3.select("#average_text_" + id)
            .transition()
            .duration(500)
            .attr("text-anchor", function () {
                return text_anchor_arr[i]
            })
            .attr("x", function () {
                var text_anchor = text_anchor_arr[i];
                if (text_anchor == "end") {
                    return self.x(median) - 5
                } else {
                    return self.x(median) + 5
                }
            })
            .attr("y", function () {
                return y_arr[i]
            })
            //.style("fill", self.cs.background_color)
            .text(name);


        d3.select("#average_value_" + id)
            .transition()
            .duration(500)
            .attr("text-anchor", function () {
                return text_anchor_arr[i]
            })
            .attr("x", function () {
                var text_anchor = text_anchor_arr[i];
                if (text_anchor == "end") {
                    return self.x(median) - 10
                } else {
                    return self.x(median) + 10
                }
            })
            .attr("y", function () {
                return y_arr[i]
            })
            .text(Math.round(median));
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

    this._no_data  = this._chart.append("text")
        .attr("class", "noDataText")
        .attr("x", "0em")
        .attr("y", 30 )
        .attr("dy", "0em")
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", "white")
        .text("");

};


DensityGraph.prototype._add_help_button = function(){

    var config = this.config;
    var self = this;

    var r = 10
    var margin = 5;
    var x =  config.full_width - r - margin;
    var y = r + margin

    this.help_circle = this._svg
        .append("circle")
        .attr("class", "clickable")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", r)
        .style("fill", "white")
        .on("click", self._draw_help.bind(this));


    this._help_text = this._svg
        .append('text')
        .attr("class", "clickable")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", margin)
        .attr("text-anchor", "middle")
        .attr('font-family', 'FontAwesome')
        .style("fill", self.cs.background_color)
        .text('\uf128')
        .on("click", self._draw_help.bind(this));


};

DensityGraph.prototype._add_return_to_graph_button = function(){

    var config = this.config;
    var self = this;

    var r = 10
    var margin = 5;
    var x =  config.full_width - r - margin;
    var y = r + margin

    this.help_circle = this._svg
        .append("circle")
        .attr("class", "clickable")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", r)
        .style("fill", "white")
        .on("click", self._redraw.bind(this));



    this._help_text = this._svg
        .append('text')
        .attr("class", "clickable")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", margin)
        .attr("text-anchor", "middle")
        .attr('font-family', 'FontAwesome')
        .style("fill", self.cs.background_color)
        .text('\uf112')
        .on("click", self._redraw.bind(this));

};

DensityGraph.prototype._draw_help = function(){

    this._svg.remove();
    this._build_graph();
    this._draw_help_text();
    this._add_return_to_graph_button();

};

DensityGraph.prototype._redraw = function(){

    this._svg.remove();
    this._draw_all();

};

DensityGraph.prototype._draw_help_text = function(){
    //todo
};







DensityGraph.prototype._bindEvents = function(){

    ee.addListener('period_change', this._period_change_listener.bind(this));
    ee.addListener('area_change', this._area_change_listener.bind(this));

};


/*------------------transitions---------------------*/

DensityGraph.prototype._area_change_listener = function() {

    //this._remove_averages();
    this.averages = this._getAverages();
    this._move_averages();


};


DensityGraph.prototype._period_change_listener = function() {

    var state = controller.state;
    var self = this;

    var state = controller.state;

    var areaType = state.areaType;
    var indicator = state.indicator;
    var genderType = state.genderType;


    //check if data is available and add no data text
    if(controller[areaType][indicator][genderType].data_period.length == 0){
        self._no_data
            .transition()
            .duration(10)
            .text("Sorry No Data Available")

    } else {
        self._no_data
            .transition()
            .duration(10)
            .text("")
    }


    //check if data is available and add change graph
    if(controller[areaType][indicator][genderType].data_period.length == 0) {

        var fNoData = d3.svg.area()
            .x(function(d) { return self.width /2 })
            .y0(function(d) { return self.height })
            .y1(function(d) { return self.height })

        this._dist_area
            .transition()
            .duration(500)
            .style("opacity", 0)


        this._dist_area
            .transition()
            .delay(500)
            .duration(0)
            .attr("d", fNoData)
            .delay(500)
            .duration(0)
            .style("opacity", 1)


        for (i in self.averages) {

            var name = self.averages[i].name;

            if(name == "England"){
                id = "England"
            } else if(name == "Wessex"){
                id = "Wessex"
            }else {
                id = "Alt"
            }

            d3.select("#average_line_" + id)
                .transition()
                .duration(500)
                .attr("y1", self.height)
                .attr("y2", self.height)

            d3.select("#average_text_" + id)
                .transition()
                .duration(1000)
                .text("")


            d3.select("#average_value_" + id)
                .transition()
                .duration(1000)
                .text("");

        }

    } else {
        var densityArray;
        this.densityDataNest.forEach(function (d, i) {
            if (d.key == state.current_period) {
                densityArray = d.values;
            }
        });

        this._dist_area
            .datum(densityArray)
            .transition()
            .duration(750)
            .attr("d", this.fArea);

        this.averages = this._getAverages();
        this._move_averages();






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

DensityGraph.prototype._getAverages = function(){

    var config = this.config;
    var state = controller.state;

    var areaType = state.areaType;
    var indicator = state.indicator;
    var genderType = state.genderType;

    var objAverages = [];

    obj = {"name": "England"};
    for(var year in controller[areaType][indicator][genderType].orderedList_data){
        var median = controller.median(controller[areaType][indicator][genderType].orderedList_data[year]);
        obj[year] = median;
    }
    objAverages.push(obj);

    obj = {"name": "Wessex"};
    var nest = d3.nest()
        .key(function(d){return d["Map Period"]})
        .entries(controller[areaType][indicator][genderType].data);

    for(var i in nest){
        var year = nest[i].key;
        var median = controller.median(nest[i].values.map(function(d){return d.Value}));
        obj[year] = median;
    }
    objAverages.push(obj);


    var id = state.current_area;
    var name = controller._get_area_short_name(id);
    obj = {"name": name}

    var nest = d3.nest()
        .key(function(d){return d["Map Period"]})
        .entries(controller[areaType][indicator][genderType].data);

    for(var i in nest){
        var year = nest[i].key;
        var value = nest[i].values.filter(function(d){
            if(d[config.id_field] == id){return d}
        })[0][config.y_field]


        obj[year] = value;
    }
    objAverages.push(obj);


    return objAverages
}


