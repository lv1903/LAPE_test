function MapD3(config) {
    this.config = config;
    this._init();
}

MapD3.prototype._init = function(){

    this._build_graph();
    this._draw_map();
    this._build_gauge();
    this._gauge_header();

    this._bindEvents();


};

MapD3.prototype._build_graph = function() {

    var config = this.config;
    var self = this;

    var full_width = 500;
    var full_height = 250;


    this.width = full_width - config.margin.left - config.margin.right;
    this.height = full_height - config.margin.bottom - config.margin.top;

    config.middle = full_width / 2;

    config.margin.middle = config.margin.left / 4;



    this._svg = d3.select(config.container_id)
        .append("div")
        .classed("svg-container", true)
        .append("svg")
        .attr("class", "widget")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + full_width + " " + full_height)
        .classed("svg-content-responsive", true)

    this._chart_left = this._svg
        .append('g')
        .attr("id", "indicator_gauge")
        .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")");

    this._chart_right = this._svg
        .append('g')
        .attr("transform", "translate(" + (config.middle + config.margin.middle) + "," + config.margin.top + ")");


};


MapD3.prototype._draw_map = function(){

    var self = this;
    var state = controller.state;

    var topojson_data = controller.topojson_data;

    var projection = d3.geo.albers()
        .center([2.5, 51.5])
        .rotate([4.4, 0])
        .parallels([50, 60])
        .scale(this.height * 50)
        .translate([this.width / 4, this.height / 4]);

    var path = d3.geo.path()
        .projection(projection);

    var features = topojson.feature(topojson_data, topojson_data.objects.collection).features;

    this._mapFeatures = this._chart_right.selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("class", "feature")
        .attr("d", path)
        .style("fill", function(d) {return self._select_map_color(d.properties.id)})
        .on("click", self._feature_click);

    //this._chart_right.append("path")
    //    .datum(topojson.mesh(this.topo, this.topo.objects.collection))
    //    .attr("class", "boundary",  function(a, b) { return a !== b; })
    //    .attr("d", path);


};


MapD3.prototype._build_gauge = function(){

    var self = this;
    var config = self.config;
    var state = controller.state;

    this._gauge = gauge('#indicator_gauge', {
        size: 170,
        clipWidth: 200,
        clipHeight: 200,
        ringWidth: 30,
        maxValue: 1,
        transitionMs: 4000,
    });
    this._gauge.render();

    var val = this.getValueFromPeriodData(state.current_area);

    this._gauge.update(val.percent)

}

MapD3.prototype._gauge_header = function(){

    var self = this;
    var config = self.config;
    var state = controller.state;



    //var current_area = state.current_area;
    //var current_area_type = controller._current_area_type;
    var current_area_name = controller.config.areaList[state.areaType].filter(function(d){
        if(d.id == state.current_area){return d}
    })[0].name;

    var format = d3.format(",.0f");
    var val = this.getValueFromPeriodData(state.current_area);
    var value = format(val.value);

    this._header  = this._chart_left.append("text")
        //.append("g")
        //.attr("transform", "translate(" + (config.margin.left)  +  "," + config.margin.top + ")");
        .attr("x", "0em")
        .attr("y", "-2em" )
        .attr("dy", "2em")
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", "white")
        .text(current_area_name);

    this._value_text  = this._chart_left.append("text")
        .attr("x", "0em")
        .attr("y", "-0.5em" )
        .attr("dy", "2em")
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", "white")
        .text(value + " " + controller.config.indicatorLabels[state.indicator]);

    if(val.count != "null"){


        var count = format(Number(val.count));

        this._count_text  = this._chart_left.append("text")
            .attr("x", "0em")
            .attr("y", "1em" )
            .attr("dy", "2em")
            .attr("text-anchor", "left")
            .style("font-size", "1.5em")
            .style("fill", "white")
            .text("Total count: " + count );

    }

    this._gauge_text  = this._chart_left.append("text")
        .attr("x", "0em")
        .attr("y", this.height )
        .attr("dy", "2.5em")
        .attr("text-anchor", "left")
        .style("font-size", "1em")
        .style("fill", "white")
        .text("Relative to all of England")
};



MapD3.prototype._bindEvents = function(){
    ee.addListener('period_change', this._period_change_listener.bind(this));
    ee.addListener('area_change', this._area_change_listener.bind(this));
}

/*------------transitions------------------------------*/


MapD3.prototype._area_change_listener = function(){

    var self = this;
    var state = controller.state

    //map
    this._mapFeatures
        .transition()
        .duration(500)
        .style("fill", function(d) {return self._select_map_color(d.properties.id)})


    //gauge
    var val = this.getValueFromPeriodData(state.current_area);
    this._gauge.update(val.percent)

    //text
    var format = d3.format(",.0f");
    var val = this.getValueFromPeriodData(state.current_area);
    var value = format(val.value);

    console.log(state.current_area_name)

    this._header
        .transition()
        .duration(750)
        .text(state.current_area_name);

    this._value_text
        .transition()
        .duration(750)
        .text(value + " " + controller.config.indicatorLabels[state.indicator]);

    if(val.count != "null"){
        var count = format(Number(val.count));
        this._count_text
            .transition()
            .duration(750)
            .text("Total count: " + count );
    }


};

MapD3.prototype._period_change_listener = function() {

    var self = this;
    var state = controller.state


    //map
    this._mapFeatures
        .transition()
        .duration(250)
        .style("fill", function(d) {return self._select_map_color(d.properties.id)})


    //gauge
    var val = this.getValueFromPeriodData(state.current_area);
    this._gauge.update(val.percent)





};


/*----functions-----------*/


MapD3.prototype.getValueFromPeriodData = function(id){

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


MapD3.prototype._select_map_color = function(id){
    //gets id and current period value and calculates index from ordered list

    var state = controller.state;

    var val = this.getValueFromPeriodData(id);

    if(state.current_area == id){
        //return d3.interpolateHsl(d3.rgb('#fff'), d3.rgb("#9b26b6"))((Math.floor(val.percent * 4) / 4).toFixed(1))
        return "#9b26b6"
    } else {
        return d3.interpolateHsl(d3.rgb('#fff'), d3.rgb('#ffcd00'))((Math.floor(val.percent * 4) / 4).toFixed(1))
    }

};

MapD3.prototype._feature_click = function(d) {

    //console.log(d.properties.id)

    controller._area_change(d.properties.id)

    //if (active === d) return reset();
    //g.selectAll(".active").classed("active", false);
    //d3.select(this).classed("active", active = d);

    //var b = path.bounds(d);
    //g.transition().duration(750).attr("transform",
    //    "translate(" + projection.translate() + ")"
    //    + "scale(" + .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height) + ")"
    //    + "translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")");
}

//function reset() {
//    g.selectAll(".active").classed("active", active = false);
//    g.transition().duration(750).attr("transform", "");
//}




var gauge = function(container, configuration) {
    var that = {};
    var config = {
        size						: 200,
        clipWidth					: 200,
        clipHeight					: 110,
        ringInset					: 20,
        ringWidth					: 20,

        pointerWidth				: 10,
        pointerTailLength			: 4,
        pointerHeadLengthPercent	: 0.9,

        minValue					: 0,
        maxValue					: 10,

        minAngle					: -100,
        maxAngle					: 100,

        transitionMs				: 750,

        majorTicks					: 4,
        labelFormat					: d3.format('%'),
        labelInset					: 10,

        arcColorFn					: d3.interpolateHsl(d3.rgb('#FFFFFF'), d3.rgb('#ffcd00'))
    };
    var range = undefined;
    var r = undefined;
    var pointerHeadLength = undefined;
    var value = 0;

    var svg = undefined;
    var arc = undefined;
    var scale = undefined;
    var ticks = undefined;
    var tickData = undefined;
    var pointer = undefined;

    var donut = d3.layout.pie();

    function deg2rad(deg) {
        return deg * Math.PI / 180;
    }

    function newAngle(d) {
        var ratio = scale(d);
        var newAngle = config.minAngle + (ratio * range);
        return newAngle;
    }

    function configure(configuration) {
        var prop = undefined;
        for ( prop in configuration ) {
            config[prop] = configuration[prop];
        }

        range = config.maxAngle - config.minAngle;
        r = config.size / 2;
        pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

        // a linear scale that maps domain values to a percent from 0..1
        scale = d3.scale.linear()
            .range([0,1])
            .domain([config.minValue, config.maxValue]);

        //console.log(scale.ticks(config.majorTicks))

        ticks = [0, .25, .5, .75, 1];
        //ticks = scale.ticks(config.majorTicks)
        tickData = d3.range(config.majorTicks).map(function() {return 1/config.majorTicks;});

        arc = d3.svg.arc()
            .innerRadius(r - config.ringWidth - config.ringInset)
            .outerRadius(r - config.ringInset)
            .startAngle(function(d, i) {
                var ratio = d * i;
                return deg2rad(config.minAngle + (ratio * range));
            })
            .endAngle(function(d, i) {
                var ratio = d * (i+1);
                return deg2rad(config.minAngle + (ratio * range));
            });
    }
    that.configure = configure;

    function centerTranslation() {
        return 'translate('+r +','+ r +')';
    }

    function isRendered() {
        return (svg !== undefined);
    }
    that.isRendered = isRendered;

    function render(newValue) {
        svg = d3.select(container)
            .append("g")
            .attr("transform", "translate(0," + 60 + ")") //???this should be configuarable
            .append('svg')
            .attr('class', 'gauge')
            .attr('width', config.clipWidth)
            .attr('height', config.clipHeight);

        var centerTx = centerTranslation();

        var arcs = svg.append('g')
            .attr('class', 'arc')
            .attr('transform', centerTx);

        arcs.selectAll('path')
            .data(tickData)
            .enter().append('path')
            .attr('fill', function(d, i) {
                return config.arcColorFn(d * i);
            })
            .attr('d', arc);

        //var lg = svg.append('g')
        //    .attr('class', 'label')
        //    .attr('transform', centerTx);
        //
        //lg.selectAll('text')
        //    .data(ticks)
        //    .enter().append('text')
        //    .attr('transform', function(d) {
        //        var ratio = scale(d);
        //        var newAngle = config.minAngle + (ratio * range);
        //        return 'rotate(' +newAngle +') translate(0,' +(config.labelInset - r) +')';
        //    })
        //    .attr("text-anchor", "middle")
        //    //.style("font-size", "1em")
        //    .text(config.labelFormat);

        var lineData = [ [config.pointerWidth / 2, 0],
            [0, -pointerHeadLength],
            [-(config.pointerWidth / 2), 0],
            [0, config.pointerTailLength],
            [config.pointerWidth / 2, 0] ];
        var pointerLine = d3.svg.line().interpolate('monotone');
        var pg = svg.append('g').data([lineData])
            .attr('class', 'pointer')
            .attr('transform', centerTx);

        pointer = pg.append('path')
            .attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/ )
            .attr('transform', 'rotate(' +config.minAngle +')');

        update(newValue === undefined ? 0 : newValue);
    }
    that.render = render;

    function update(newValue, newConfiguration) {
        if ( newConfiguration  !== undefined) {
            configure(newConfiguration);
        }
        var ratio = scale(newValue);
        var newAngle = config.minAngle + (ratio * range);
        pointer.transition()
            .duration(config.transitionMs)
            .ease('elastic')
            .attr('transform', 'rotate(' +newAngle +')');
    }
    that.update = update;

    configure(configuration);

    return that;
};