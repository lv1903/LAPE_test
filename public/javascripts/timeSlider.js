

TimeSlider = function(config){

    this.config = config;
    this._init();


};



TimeSlider.prototype._init = function(){


    this._build_graph();
    this._set_scales();
    this._draw_axes();
    this._define_brush();
    this._draw_slider();



};


TimeSlider.prototype._build_graph = function(){

    var config = this.config;
    var state = controller.state;

    var full_width = 500;
    var full_height = 125;

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


TimeSlider.prototype._set_scales = function() {

    var self = this;

    this.x = d3.scale.linear()
        .domain([2009, 2013]) //should calculate domain???
        .range([0, self.width])
        .clamp(true)
        .nice(10);

};


TimeSlider.prototype._draw_axes = function(){

    var self = this;

    this.xAxis = d3.svg.axis()
        .scale(self.x)
        .orient("bottom")
        .tickFormat(function(d) {return d;})
        .tickSize(0)
        .tickPadding(12)
        .tickValues([self.x.domain()[0], self.x.domain()[1]]);

    this._chart.append("g")
        .attr("class", "slider x axis")
        .attr("transform", "translate(0," + self.height / 2 + ")")
        .call(self.xAxis)
        .select(".domain")
        .select(function() {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "halo")

};


TimeSlider.prototype._define_brush = function(){

    var self = this;
    var state = controller.state;

    // defines brush
    this.brush = d3.svg.brush()
        //.x(timeScale)
        .x(self.x)
        .extent([state.current_period, state.current_period])
        .on("brush", function() {

            var value = self.brush.extent()[0];

            if (d3.event.sourceEvent) { // not a programmatic event
                  value = self.x.invert(d3.mouse(this)[0]);
                  self.brush.extent([value, value]);

            }

            self.handle.attr("transform", "translate(" + self.x(Math.round(value)) + ",0)");

            //console.log(state.current_period + " " + value + " " + Math.round(value))


            //d3.select(".handle")
            //self.handle
            //    .transition()
            //    .duration(200)
            //    .ease("quadin")
            //    .attr("transform", "translate(" + self.x(value) + ",0)")
            //    .transition()
            //    .duration(500)
            //    .ease("quadout")
            //    .attr("transform", "translate(" + self.x(Math.round(value)) + ",0)");

            self.handle.select('text').text(Math.round(value));
            controller._period_change(Math.round(value));

        });

};

TimeSlider.prototype._draw_slider = function(){

    var self = this;
    var state = controller.state;

    var slider = this._chart.append("g")
        .attr("class", "slider")
        .call(self.brush);

    slider.selectAll(".extent,.resize")
        .remove();

    slider.select(".background")
        .attr("height", self.height);

    this.handle = slider.append("g")
        .attr("class", "handle")
        //.on("mouseout", self._snap_handle);

    this.handle.append("path")
        .attr("transform", "translate(0," + self.height / 2 + ")")
        .attr("d", "M 0 -10 V 10")
        //.on("mouseout", self._snap_handle);

    this.handle.append('text')
        .text(self.x(state.current_period))
        .attr("transform", "translate(" + (-18) + " ," + (self.height / 2 - 15) + ")")
        //.on("mouseout", self._snap_handle);

    slider
        .call(self.brush.event)


};

TimeSlider.prototype._snap_handle = function(){

    console.log("Snap handle")

}



