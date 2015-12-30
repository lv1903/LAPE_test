function AreaFacts(config) {

    this.config = config;
    this.cs = controller.config.colorScheme;
    this._init();
}

AreaFacts.prototype._init = function(){


    this._draw_all();
    this._bindEvents();


};

AreaFacts.prototype._draw_all = function(){

    this._build_graph();
    this._add_help_button();
    this._build_gauge();
    this._write_facts();


}

AreaFacts.prototype._build_graph = function() {

    var config = this.config;
    var self = this;

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

AreaFacts.prototype._build_gauge = function(){

    var self = this;
    var config = self.config;
    var state = controller.state;

    var areaType = state.areaType;
    var indicator = state.indicator;
    var genderType = state.genderType;

    this._gauge_low_label = self._chart.append("text")
        .attr("x", -10)
        .attr("y", 150)//, bbox.y + bbox.height) //make dynamic
        //.attr("dy", "0em")
        .attr("text-anchor", "left")
        .style("font-size", "1em")
        .style("fill", "white")
        .call(controller._wrap, 30, "England Low");


    this._gauge_high_label = self._chart.append("text")
        .attr("x", self.width - 35)
        .attr("y", 150)//, bbox.y + bbox.height) //make dynamic
        //.attr("dy", "0em")
        .attr("text-anchor", "right")
        .style("font-size", "1em")
        .style("fill", "white")
        .call(controller._wrap, 30, "England High");

    //add gauge------------------------------------------------
    var sideLength = 180;

    this._gauge = this._fGauge(self._chart, {
        size: sideLength,
        clipWidth: sideLength,
        clipHeight: sideLength,
        ringWidth: 40,
        maxValue: 1,
        transitionMs: 4000,
        color1: "white",
        color2: self.cs.dark_text_color,
        xTranslate: self.width / 2 - sideLength / 2,
        yTranslate: 110

    });


    this._gauge.render();


    //check if data is available for period otherwise send 0 and exit
    if(controller[areaType][indicator][genderType].data_period.length == 0){
        this._gauge.update(0)
        return
    }



    var val = this.getValueFromPeriodData(state.current_area);
    this._gauge.update(val.percent)
};






AreaFacts.prototype._write_facts = function(){

    var self = this;
    var config = self.config;
    var state = controller.state;

    var areaType = state.areaType;
    var indicator = state.indicator;
    var genderType = state.genderType;

    var bbbox;
    var y;
    var x;
    var delta_y = 42;
    //var font_size = 1.5;


    //add header-------------------------------------
    y = 0;
    x = 0;

    this._header  = this._chart.append("text")
        .attr("class", "headerText")
        .attr("id", "areaFactsHeader")
        .attr("x", x)
        .attr("y",  y)
        //.attr("dy", "0em")
        .attr("text-anchor", "left")
        .style("font-size", "1.5em")
        .style("fill", self.cs.highlight_color)
        .call(controller._wrap, self.width, state.current_area_name);


    //check if data is available if not write No data
    if(controller[areaType][indicator][genderType].data_period.length == 0){

        bbox = d3.select("#areaFactsHeader").node().getBBox(); //this wont work for multiple widgets!!
        y = bbox.height + bbox.y + delta_y; //shift y
        x = 0;


        y = bbox.height + bbox.y + delta_y; //shift y
        x = 0;

        //var arr = [value, unit]

        stringObj = [
            {str: "Sorry No Data Available", font_size: "1.5em"},
        ];

        textName = "valueText";

        self._add_string(self, textName, stringObj, x, y);

        return
    }


    //add all facts----------------------------------------
    //get values
    var format = d3.format(",.0f");
    var val = this.getValueFromPeriodData(state.current_area);

    var stringObj;
    var textName;

    var value, unit;

    //add value text---------------------------------------------
    bbox = d3.select("#areaFactsHeader").node().getBBox(); //this wont work for multiple widgets!!
    y = bbox.height + bbox.y + delta_y; //shift y
    x = 0;

    value = format(val.value);
    unit = controller.config.indicatorLabels[state.indicator];

    //var arr = [value, unit]

    stringObj = [
        {str: value, font_size: "1.5em"},
        {str: unit, font_size: "1em"}
    ];

    textName = "valueText";

    self._add_string(self, textName, stringObj, x, y);


    //add count text if available----------------------------------------
    if(val.count != null){

        value = format(Number(val.count));
        unit = controller.config.genderLabels[state.genderType];

        //bbox = d3.select("#areaFactsValue").node().getBBox()

        y+= delta_y; //shift y

        stringObj = [
            {str: value, font_size: "1.5em"},
            {str: unit, font_size: "1em"}
        ];

        textName = "countText";

        self._add_string(self, textName, stringObj, x, y);

    };


    //add rank text--------------------------------------------

    //console.log(config)


    prefix = "Ranked ";
    rank = format(val.index + 1);
    middle = "out of ";
    total = format(controller[areaType][indicator][genderType].orderedList_data[state.current_period].length);
    suffix = " " + controller.getKeyByValue(controller.config.areaTypeMapping, state.areaType).toLowerCase();

    var stringObj = [
        {"str": prefix, "font_size": "1em"},
        {"str": rank, "font_size": "1.5em"},
        {"str": middle, "font_size": "1em"},
        {"str": total, "font_size": "1.5em"},
        {"str": suffix, "font_size": "1em"}
    ]

    var textName = "rankText"

    //bbox = d3.select(".gaugeSVG").node().getBBox(); //this will not work for multiple widgets!!
    //console.log(bbox)
    //y += bbox.y + bbox.height + delta_y;
    y = 260;
    x = 0;

    self._add_string(self, textName, stringObj, x, y)

};



AreaFacts.prototype._add_help_button = function(){

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

AreaFacts.prototype._add_return_to_graph_button = function(){

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

AreaFacts.prototype._draw_help = function(){

    this._svg.remove();
    this._build_graph();
    this._draw_help_text();
    this._add_return_to_graph_button();

};

AreaFacts.prototype._redraw = function(){

    this._svg.remove();
    this._draw_all();

};

AreaFacts.prototype._draw_help_text = function(){
    //todo
};





AreaFacts.prototype._bindEvents = function(){

    ee.addListener('period_change', this._period_change_listener.bind(this));
    ee.addListener('area_change', this._area_change_listener.bind(this));
}

/*------------transitions-----------------------------------------------------------------------------------------*/


AreaFacts.prototype._area_change_listener = function(){

    var self = this;
    var state = controller.state;

    var areaType = state.areaType;
    var indicator = state.indicator;
    var genderType = state.genderType;

    //console.log(val)

    //gauge--------------------------------------------------------------------
    //check if data is available for period otherwise send 0
    if(controller[areaType][indicator][genderType].data_period.length == 0){
        this._gauge.update(0)
        return
    } else {
        var val = this.getValueFromPeriodData(state.current_area);
        this._gauge.update(val.percent);
    }
    //---------------------------------------------------------------------------

    //rewrite facts instead of transition

    var removeList = [ //this needs to be more specific!!
        ".headerText",
        ".valueText",
        ".countText",
        ".rankText"

    ]
    for(var i in removeList){
        if(!d3.selectAll(removeList[i]).empty()){d3.selectAll(removeList[i]).remove()}
    }

    self._write_facts();


};


AreaFacts.prototype._period_change_listener = function() {

    var self = this;
    var state = controller.state;

    var areaType = state.areaType;
    var indicator = state.indicator;
    var genderType = state.genderType;


    //gauge--------------------------------------------------------------------
    //check if data is available for period otherwise send 0
    if(controller[areaType][indicator][genderType].data_period.length == 0){
        this._gauge.update(0)
    } else {
        var val = this.getValueFromPeriodData(state.current_area);
        this._gauge.update(val.percent);
    }
    //---------------------------------------------------------------------------

    //remove and rewrite facts instead of transition

    var removeList = [
        ".headerText",
        ".valueText",
        ".countText",
        ".rankText"

    ]
    for(var i in removeList){
        if(!d3.selectAll(removeList[i]).empty()){d3.selectAll(removeList[i]).remove()}
    }

    self._write_facts();





};


/*----functions-----------*/


AreaFacts.prototype._add_string = function(self, textName, stringObj, x, y ){

    //console.log(textName)

    for(var i in stringObj){
        var name = "_" + textName + i;
        var str = stringObj[i].str;
        var font_size = stringObj[i].font_size;

        if( i > 0) {
            x += 5 + self[ "_" + textName + (i - 1)].node().getComputedTextLength() ;
        };

        self[name] = self._chart
            .append("text")
            .attr("class", textName)
            .attr("x", x)
            .attr("y", y)
            .attr("dy", "0em")
            .attr("text-anchor", "left")
            .style("font-size", font_size)
            .style("fill", "white")
            .text(str);
    }

};


AreaFacts.prototype.getValueFromPeriodData = function(id){

    var self = this;
    var config = self.config;

    var state = controller.state;

    var areaType = state.areaType;
    var indicator = state.indicator;
    var genderType = state.genderType;

    var value = controller[areaType][indicator][genderType].data_period.filter(function(d){
        if(d[config.id_field] == id){return  d}
    })[0][config.value_field];

    var count = controller[areaType][indicator][genderType].data_period.filter(function(d){
        if(d[config.id_field] == id){return  d}
    })[0][config.count_field];

    var orderedList = controller[areaType][indicator][genderType].orderedList_data[state.current_period];
    var index = orderedList.indexOf(value);
    var percent = index / orderedList.length;

    return {"value": value, "count": count, "index": index, "percent": percent}

};



AreaFacts.prototype._fGauge = function(container, configuration) {
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

        minAngle					: -90,
        maxAngle					: 90,

        transitionMs				: 750,

        majorTicks					: 4,
        labelFormat					: d3.format(''),
        labelInset					: 20,

        arcColorFn					: d3.interpolateHsl(d3.rgb(configuration.color1), d3.rgb(configuration.color2))
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

        tickString = ["Eng. Low", "", "", "", "Eng. High"];
        ticks = scale.ticks(config.majorTicks)
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
        svg = container
            .append("g")
            .attr("class", "gaugeSVG")
            .attr("transform", "translate(" + configuration.xTranslate + "," + configuration.yTranslate + ")")
            .append('svg')
            .attr('class', 'gauge') //should go in config!!
            .attr("id", "gauge") //should go in config!!
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

        var lg = svg.append("g")
            .attr("class", "label")


        //lg.selectAll("text")
        //    .data(tickString)
        //    .enter()
        //    .append("text")
        //    .attr("x", function(d, i) { return i * configuration.clipWidth})
        //    .attr("y", configuration.clipHeight / 2)
        //    .attr("text-anchor", function(d, i){ if(i == 0){ return "end"}else{return "start"}})
        //    .text(function(d){ return d})
        //    .style("fill", "white")
        //    .style("font-size", "1em")
        //    .moveToFront();



        //var lg = svg.append('g')
        //    .attr('class', 'label')
        //    .attr('transform', centerTx);
        //
        //lg.selectAll('text')
        //    .data(ticks)
        //    .enter().append('text')
        //    //.attr('transform', function(d) {
        //    //    var ratio = scale(d);
        //    //    var newAngle = config.minAngle + (ratio * range);
        //    //    return 'rotate(' +newAngle +') translate(0,' +(config.labelInset - r) +')';
        //    //})
        //    .attr("x", function(d, i) {
        //        var sign = 1;
        //        if (i == 0) {sign = -1}
        //        return sign * configuration.clipWidth / 2 -  sign * 30
        //    })
        //    //.attr("x", 50)
        //    .attr("y", 10)
        //    .attr("text-anchor", "middle")//function(d, i){ if(i == 0){ return "end"}else{return "start"}})
        //    .style("font-size", "1em")
        //    .style("fill", "white")
        //    //.text(config.labelFormat);
        //    .text(function(d, i){return tickString[i]});



        var lineData = [ [config.pointerWidth / 2, 0],
            [0, -pointerHeadLength],
            [-(config.pointerWidth / 2), 0],
            [0, config.pointerTailLength],
            [config.pointerWidth / 2, 0] ];
        var pointerLine = d3.svg.line().interpolate('monotone');
        var pg = svg.append('g').data([lineData])
            .attr('class', 'pointer')
            .attr('transform', centerTx)
            .style("fill", controller.config.colorScheme.highlight_color)
            .style("stroke", controller.config.colorScheme.dark_text_color);

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