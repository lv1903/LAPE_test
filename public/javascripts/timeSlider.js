

TimeSlider = function(config){

    this.config = config;
    this.cs = controller.config.colorScheme;
    this._init();


};



TimeSlider.prototype._init = function(){

    this._draw_all();
    this._bindEvents();



};

TimeSlider.prototype._draw_all = function(){

    this._build_graph();
    this._add_help_button();
    this._draw_text();
    this._set_scales();
    this._draw_axes();
    this._define_brush();
    this._draw_slider();

};


TimeSlider.prototype._build_graph = function(){

    var config = this.config;
    var state = controller.state;

    config.full_width = 300;
    config.full_height = 400;

    this.width =  config.full_width - config.margin.left  - config.margin.right;
    this.height = config.full_height - config.margin.bottom - config.margin.top;

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

TimeSlider.prototype._draw_text = function(){


    var self = this;
    var config = self.config;
    var state = controller.state;

    var bbbox;
    var y;
    var x;
    var delta_y = 42;

    //add header-------------------------------------
    y = 0;
    x = 0;

    this._indicatorText  = this._chart.append("text")
        .attr("class", "indicatorText")
        .attr("id", "indicatorText")
        .attr("x", x)
        .attr("y",  y)
        //.attr("dy", "0em")
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", "white")
        .call(controller._wrap, self.width, state.indicator);


    bbox = d3.select("#indicatorText").node().getBBox(); //this wont work for multiple widgets!!
    y = bbox.height + bbox.y + delta_y; //shift y
    x = 0;

    this._genderText  = this._chart.append("text")
        .attr("class", "genderText")
        .attr("id", "genderText")
        .attr("x", x)
        .attr("y",  y)
        //.attr("dy", "0em")
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", "white")
        .call(controller._wrap, self.width, state.genderType);


};




TimeSlider.prototype._set_scales = function() {

    var self = this;

    this.x = d3.scale.linear()
        .domain([2008 - 0.25, 2014 + 0.25 ]) //should go into config!!
        .range([0, self.width])
        .clamp(true);
        //.nice(10);

};


TimeSlider.prototype._draw_axes = function(){

    var self = this;

    this.xAxis = d3.svg.axis()
        .scale(self.x)
        .orient("bottom")
        .tickFormat(function(d) {return d;})
        .tickSize(0)
        .tickPadding(12)
        .tickValues([Math.round(self.x.domain()[0]), Math.round(self.x.domain()[1])]);

    this._chart.append("g")
        .attr("class", "slider x axis")
        .attr("transform", "translate(0," + self.height + ")")
        .style("fill", self.cs.main_color) //not working still in css!!!
        .call(self.xAxis)
        .select(".domain")
        .select(function() {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "halo")
        .style("fill", self.cs.main_color); //not working still in css!!!

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
            self.handle.select('text').text(Math.round(value));

            //console.log("time slider call period change")
            controller._period_change(Math.round(value));

        })
};

TimeSlider.prototype._draw_slider = function(){

    var self = this;
    var state = controller.state;

    this.slider = this._chart.append("g")
        .attr("class", "slider")
        .call(self.brush);

    this.slider.selectAll(".extent,.resize")
        .remove();

    this.slider.select(".background")
        .attr("height", self.height);

    this.handle = this.slider.append("g")
        .attr("class", "handle clickable")
        //.on("mouseout", self._snap_handle);

    this.handle.append("path")
        .attr("transform", "translate(0," + self.height  + ")")
        .attr("d", "M 0 -10 V 10")
        //.on("mouseout", self._snap_handle);

    this.handle.append('text')
        .text(self.x(state.current_period))
        .attr("transform", "translate(" + (-18) + " ," + (self.height - 15) + ")")
        //.on("mouseout", self._snap_handle);

    this.slider
        .call(self.brush.event)


};



TimeSlider.prototype._add_help_button = function(){

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

TimeSlider.prototype._add_return_to_graph_button = function(){

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

TimeSlider.prototype._draw_help = function(){

    this._svg.remove();
    this._build_graph();
    this._draw_help_text();
    this._add_return_to_graph_button();

};

TimeSlider.prototype._redraw = function(){

    this._svg.remove();
    this._draw_all();

};

TimeSlider.prototype._draw_help_text = function(){
    //todo
};




TimeSlider.prototype._bindEvents = function(){

    ee.addListener('period_change', this._period_change_listener.bind(this));

};

TimeSlider.prototype._period_change_listener = function(){

    var self = this;

    var value = controller.state.current_period;

    self.handle
        .transition()
        .duration(500)
        .ease("exp")
        .attr("transform", "translate(" + self.x(Math.round(value)) + ",0)");

    self.handle.select('text').text(Math.round(value));


    //controller._period_change(Math.round(value));**


};



