


var Controller = function(data, density_data, topjson_data, config){

    //console.log(data)

    this._config = config;
    this._data = data;
    this.density_data = density_data;
    this.topojson_data = topojson_data;
    this._current_period = 2012; //???set in config
    this._init_dimensions(data);


};



Controller.prototype._init_dimensions = function(data){
    //move to config file??
    this._cf_data = crossfilter(this._data);
    this.periodDimension = this._cf_data.dimension(function(d){return d["Map Period"]});

};

Controller.prototype._period_change = function(value){
    this._current_period = value;
    //console.log(value)
    //console.log(this._data)
    this.periodDimension.filter(this._current_period);
    this._data_period = this.periodDimension.top(Infinity);

}