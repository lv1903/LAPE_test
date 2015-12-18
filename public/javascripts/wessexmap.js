function WessexMap(config) {

    this.config = config;
    this.cs = controller.config.colorScheme;
    this._init();
}

WessexMap.prototype._init = function(){

    this._build_graph();
    this._draw_map();
    this._draw_headers();

    this._bindEvents();


};

WessexMap.prototype._build_graph = function() {

    var config = this.config;
    var self = this;

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


WessexMap.prototype._draw_map = function(){

    var self = this;
    var state = controller.state;
    this.cs = controller.config.colorScheme;

    var topojson_data = controller.topojson_data;

    //console.log(topojson_data)

    var projection = d3.geo.albers()
        .center([2.05, 51.45])
        .rotate([4.4, 0])
        .parallels([50, 60])
        .scale(this.height * 40)
        .translate([this.width / 4, this.height / 4]);

    var path = d3.geo.path()
        .projection(projection);

    var features = topojson.feature(topojson_data, topojson_data.objects.collection).features;

    this._mapFeatures = this._chart.selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("class", "feature clickable")
        .attr("id", function(d){ return "feature" + d.properties.id})
        .attr("d", path)
        //.style("stroke", self.cs.background_color)
        .style("stroke", function(d) {return self._select_map_stroke_color(d.properties.id)})
        .style("stroke-width", "2px")
        .style("fill", function(d) {return self._select_map_color(d.properties.id)})
        .on("click", self._feature_click);

    d3.select("#feature" + state.current_area).moveToFront();


};

WessexMap.prototype._draw_headers = function(){

    var self = this;
    var config = self.config;
    var state = controller.state;

    //var current_area_name = controller.config.areaList[state.areaType].filter(function(d){
    //    if(d.id == state.current_area){return d}
    //})[0].name;

    var format = d3.format(",.0f");
    var val = this.getValueFromPeriodData(state.current_area);
    var value = format(val.value);


    this._header  = this._chart.append("text")
        //.append("g")
        //.attr("transform", "translate(" + (config.margin.left)  +  "," + config.margin.top + ")");
        .attr("x", "0em")
        .attr("y", "0em" )
        .attr("dy", "0em")
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", "white")
        .text("Wessex " + controller.config.areaTypeMapping[state.areaType]);
        //.call(controller._wrap, self.width, state.current_area_name)


    this._header  = this._chart.append("text")
        //.append("g")
        //.attr("transform", "translate(" + (config.margin.left)  +  "," + config.margin.top + ")");
        .attr("x", "0em")
        .attr("y", self.height )
        .attr("dy", "0em")
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", self.cs.highlight_color)
        .call(controller._wrap, self.width, state.current_area_name)
        //.text(current_area_name);
}



WessexMap.prototype._bindEvents = function(){
    ee.addListener('period_change', this._period_change_listener.bind(this));
    ee.addListener('area_change', this._area_change_listener.bind(this));
}

/*------------transitions------------------------------*/


WessexMap.prototype._area_change_listener = function(){

    var self = this;
    var state = controller.state

    //map
    this._mapFeatures
        .transition()
        .duration(500)
        .style("fill", function(d) {return self._select_map_color(d.properties.id)})
        .style("stroke", function(d) {return self._select_map_stroke_color(d.properties.id)});

    d3.select("#feature" + state.current_area).moveToFront();



    //text
    //var format = d3.format(",.0f");
    //var val = this.getValueFromPeriodData(state.current_area);
    //var value = format(val.value);

    //console.log(state.current_area_name)

    this._header
        .transition()
        .duration(750)
        .call(controller._wrap, self.width, state.current_area_name)





};

WessexMap.prototype._period_change_listener = function() {

    var self = this;
    var state = controller.state


    //map
    this._mapFeatures
        .transition()
        .duration(250)
        .style("fill", function(d) {return self._select_map_color(d.properties.id)})

};


/*----functions-----------*/


WessexMap.prototype.getValueFromPeriodData = function(id){

    var self = this;
    var config = self.config;

    var state = controller.state;

    var value = controller.data_period.filter(function(d){
        if(d[config.id_field] == id){return  d}
    })[0][config.value_field];

    var count = controller.data_period.filter(function(d){
        if(d[config.id_field] == id){return  d}
    })[0][config.count_field];

    var orderedList = controller.orderedList_data[state.current_period];
    var index = orderedList.indexOf(value);
    var percent = index / orderedList.length;

    return {"value": value, "count": count, "index": index, "percent": percent}

};


WessexMap.prototype._select_map_color = function(id){
    //gets id and current period value and calculates index from ordered list

    var state = controller.state;
    var self = this;

    //var val = this.getValueFromPeriodData(id);

    if(controller.data_period.length == 0){
        return "white"
    } else {
        var val = this.getValueFromPeriodData(id);
        return d3.interpolateHsl(d3.rgb('#fff'), d3.rgb(this.cs.dark_text_color))((Math.floor(val.percent * 4) / 4).toFixed(1))
    }

};

WessexMap.prototype._select_map_stroke_color = function(id){
    //gets id and current period value and calculates index from ordered list

    var state = controller.state;
    var self = this;

    var val = this.getValueFromPeriodData(id);

    if(state.current_area == id){
        return self.cs.highlight_color
    } else {
        //return d3.interpolateHsl(d3.rgb('#fff'), d3.rgb(this.cs.dark_text_color))((Math.floor(val.percent * 4) / 4).toFixed(1))
        return this.cs.background_color
    }

};

WessexMap.prototype._feature_click = function(d) {

    //console.log(d.properties.id)

    controller._area_change(d.properties.id)

}








