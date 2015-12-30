
var ee = new EventEmitter();

var Controller = function(data_obj, config, state_obj){



    this.config = config;

    this.state = state_obj;
    this.state.current_period = config.defaultPeriod;

    var areaType = this.state.areaType;
    var indicator = this.state.indicator;
    var genderType = this.state.genderType;

    this[areaType] = {};
    this[areaType][indicator] = {};
    this[areaType][indicator][genderType] = {};

    this[areaType][indicator][genderType].data = data_obj[areaType][indicator][genderType].data;

    this[areaType][indicator][genderType].density_data = data_obj[areaType][indicator][genderType].density_obj;
    this[areaType].topojson_data = data_obj[areaType].topojson_obj;

    this[areaType][indicator][genderType].orderedList_data = data_obj[areaType][indicator][genderType].orderedList_obj;


    //filer data for current period
    this[areaType][indicator][genderType].data_period = [];
    this._init_dimensions(areaType, indicator, genderType);


    //pick a random area
    var randomIndex = Math.floor(Math.random() * this[areaType][indicator][genderType].data_period.length)
    this.state.current_area = this[areaType][indicator][genderType].data_period[randomIndex]["Area Code"]; //Area Code should be in config!!

    //this.state.current_secondary_areas = ["E38000045", "E38000154"];
    this.state.current_secondary_areas = [];
    this.state.secondary_areas_colors = ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"];


    this.state.current_area_name = this._get_area_name(this.state.current_area);

    //console.log(this.state)

    this._update_selects()


};

Controller.prototype._update_selects = function(){

    //console.log(this.state)

    document.getElementById("indicatorTypeSelect").value = this.state.indicator;
    document.getElementById("genderTypeSelect").value = this.state.genderType;
    document.getElementById("areaTypeSelect").value = this.state.areaType;




}

Controller.prototype._get_area_name = function(id){
    var self = this;
    return self.config.areaList[self.state.areaType].filter(function(d){
        if(d.id == id){return d}
    })[0].name;
};

Controller.prototype._get_area_short_name = function(id){
    var self = this;
    return self.config.areaList[self.state.areaType].filter(function(d){
        if(d.id == id){return d}
    })[0].short_name;
};





Controller.prototype._init_dimensions = function(areaType, indicator, genderType){



    //move to config file??
    this[areaType][indicator][genderType].cf_data = crossfilter(this[areaType][indicator][genderType].data);
    this[areaType][indicator][genderType].periodDimension = this[areaType][indicator][genderType].cf_data.dimension(function(d){return d["Map Period"]});
    //console.log("init demensions call period change")
    this._period_change(this.state.current_period);



};

Controller.prototype._period_change = function(value){

    var areaType = this.state.areaType;
    var indicator = this.state.indicator;
    var genderType = this.state.genderType;

    this.state.current_period = value;
    this[areaType][indicator][genderType].periodDimension.filter(this.state.current_period);
    this[areaType][indicator][genderType].data_period = this[areaType][indicator][genderType].periodDimension.top(Infinity);

    //console.log("event: period_change");
    ee.emitEvent("period_change")
};



Controller.prototype._area_change = function(id){

    this.state.current_area = id;
    this.state.current_area_name = this._get_area_name(id);

    ee.emitEvent("area_change")
};


Controller.prototype._secondary_area_change = function(){


    //this.state.current_secondary_areas = []


    ee.emitEvent("secondary_area_change")



}


Controller.prototype.validate_NaN_to_0 = function(val){
    if(isNaN(val)) return 0; else return Number(val);
};

Controller.prototype.median = function(values){
    values.sort( function(a,b) {return a - b;} );
    var half = Math.floor(values.length/2);
    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
};

Controller.prototype._wrap = function(text, width, string){
    text.each(function () {
        var text = d3.select(this),
            words = string.split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                .append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                    .text(word);
            }
        }
    });
}


Controller.prototype.getKeyByValue = function( obj, value ) {
    for( var prop in obj) {
        if( obj.hasOwnProperty( prop ) ) {
            if( obj[ prop ] === value )
                return prop;
        }
    }
}



