


var Controller = function(data, config){

    this._config = config;
    this._init_dimensions(data);
    //this._init_state();

    //this._init_change_view();
    //this._bindEvents();

};



Controller.prototype._init_dimensions = function(data){
    //move to config file??
    this._data = crossfilter(data);
    //add dimensions
    this.areaTypeDimension = this._data.dimension(function(d){return d["Area Type"]});
    this.areaDimension = this._data.dimension(function(d){return d["Area Code"]});
    this.indicatorDimension = this._data.dimension(function(d){return d["Indicator"]});
    this.genderDimension = this._data.dimension(function(d){return d["Sex"]});
    this.periodDimension = this._data.dimension(function(d){return d["Time Period"]});
};

Controller.prototype._list_options = function(filterName){
    //get the source header from the config file
    var res = this._config.filter.filter(function( obj ) {
        return obj.name == filterName;
    });
    var sourceHeader = res[0].sourceHeader;

    //determine the list
    var dimension = filterName + "Dimension";

    //cannot get cf to work as expected??
    //workaround remove filter then after list reapply
    this._remove_filter(filterName);

    var list_options = this[dimension]
    .top(Infinity)
    .map(function(d){ return (d[sourceHeader])})
    .reduce(function(a,b){if (a.slice(-1)[0] !== b) a.push(b);return a;},[]);

    //reapply filter
    this._add_filter(filterName);

    return list_options;
};


Controller.prototype._apply_filter = function(filterName, filterValue){
    this._set_current_filter_value(filterName, filterValue);
    this._add_filter(filterName);
    this._update_all_filter_lists();
    this._update_change_view();
};

Controller.prototype._update_all_filter_lists = function(){

    var filters = this._config.filter;

    for(var i = 0; i < filters.length; i++ ) {
        var filterName = filters[i].name;
        var filterList = filterName + "List";
        this[filterList] = this._list_options(filterName);
        //console.log(this[filterList])
    }
};


Controller.prototype._add_filter = function(filterName){
    var dimension = filterName + "Dimension";
    if(this[filterName] == "null"){
        this[dimension].filterAll()
    } else {
        this[dimension].filter(this[filterName]);
    }
};

Controller.prototype._remove_filter = function(filterName){
    var dimension = filterName + "Dimension";
    this[dimension].filterAll();
};

Controller.prototype._set_current_filter_value = function(filterName, filterValue){
    this[filterName] = filterValue;
};



Controller.prototype._remove_current_filter_value = function(filterName){
    this[filterName] = null;
};

Controller.prototype._update_change_view = function(){

    var filter = this._config.filter;

    for(var i = 0; i < filter.length; i++ ) {
        var filterName = filter[i].name;
        var elementId = filterName + "Select";
        var option_list = this[filterName + "List"];
        var option_value = this[filterName];
        //console.log(option_list)
        changeView._set_filter(elementId, option_list, option_value)
    }

};

Controller.prototype._slider_change = function(value){

    if(value != this.slider){
        console.log("slider")
    }

};




/*


Controller.prototype._init_filter = function(filterName){

    var elementId = filterName + "Select";
    var dimension = filterName + "Dimension";
    var dimensionList = filterName + "List";

    //get available option list and add to the change view
    this[dimensionList] = this._list_options(this[dimension]);

    //and add to the change view
    changeView._add_all_options(this[dimensionList], elementId);

    //select first in list
    this[filterName] = this[dimensionList][0];
    //and select that in the change view
    changeView._option_select(this._areaType, id);

    //filter by the selected option
    this[dimension].filter(this[filterName]);

};

Controller.prototype._init_state = function(){

    var filter = this._config.filter;

    //set report Type
    id = "reportTypeSelect";
    this._reportType = "Area Report";
    changeView._option_select(this._reportType, id);



    //loop through the filters in the config file
    //and add the available options to the change view
    //and select one option as current
    //should split this into two functions???
    for(var i = 0; i < filter.length; i++){
        this._init_filter(filter[i].name);
        console.log(this._data.groupAll().reduceCount().value())
    }




};
*/

Controller.prototype._bindEvents = function(){









};









Controller.prototype._init_state = function(){

    var filterName;
    var filterList;


    //add area type filter

    filterName = "areaType";
    filterList = filterName + "List";

    //get list of options
    this[filterList] = this._list_options(filterName);
    //select one
    this[filterName] = this[filterList][0];
    //add filter
    this._add_filter(filterName);


    //add area filter
    filterName = "area";
    filterList = filterName + "List";

    //get pre-defined list from config
    this[filterList] = this._config.areaList[this["areaType"]].map(function(d){return d.id});
    //select one
    this[filterName] = this[filterList][0];
    //add filter
    this._add_filter(filterName);

    //add Indicator Filter
    filterName = "indicator";
    filterList = filterName + "List";

    //get list of options
    this[filterList] = this._list_options(filterName);
    //select one
    this[filterName] = this[filterList][0];
    //add filter
    this._add_filter(filterName);


    //add gender Filter
    filterName = "gender";
    filterList = filterName + "List";

    //get list of options
    this[filterList] = this._list_options(filterName);
    //select one
    this[filterName] = this[filterList][0];
    //add filter
    this._add_filter(filterName);

    //add period Filter
    filterName = "period";
    filterList = filterName + "List";

    //get list of options
    this[filterList] = this._list_options(filterName);
    //select one
    this[filterName] = this[filterList][0];
    //add filter
    this._add_filter(filterName);



    this._update_change_view()

};
