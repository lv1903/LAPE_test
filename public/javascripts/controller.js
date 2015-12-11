
var ee = new EventEmitter();

var Controller = function(data_obj, config, state_obj){



    this.config = config;

    this.data = data_obj.data;
    this.data_period = [];
    this.density_data = data_obj.density_obj;
    this.topojson_data = data_obj.topojson_obj;
    this.orderedList_data = data_obj.orderedList_obj;

    this.state = state_obj;

    this.state.current_period = config.defaultPeriod;
    this.state.current_area = "E38000118";

    this.state.current_area_name = this._get_area_name();


    this._init_dimensions(this._data);

    //console.log(this.state)


};

Controller.prototype._get_area_name = function(){

    var self = this;
    return self.config.areaList[self.state.areaType].filter(function(d){
        if(d.id == self.state.current_area){return d}
    })[0].name;

}



Controller.prototype._init_dimensions = function(data){
    //move to config file??
    this.cf_data = crossfilter(this.data);
    this.periodDimension = this.cf_data.dimension(function(d){return d["Map Period"]});
    this._period_change(this.state.current_period);


};

Controller.prototype._period_change = function(value){

    this.state.current_period = value;
    this.periodDimension.filter(this.state.current_period);
    this.data_period = this.periodDimension.top(Infinity);

    ee.emitEvent("period_change")
};


Controller.prototype._area_change = function(id){

    this.state.current_area = id;
    this.state.current_area_name = this._get_area_name();

    ee.emitEvent("area_change")
};







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
}



