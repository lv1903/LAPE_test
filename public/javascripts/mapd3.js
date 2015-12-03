function MapD3(config, indicator) {
    this._config = config;
    this.indicator = indicator;

}

MapD3.prototype._init = function(){



    console.log("init Map");

    this.data = controller._data;
    this.topo = controller.topojson_data;




    this._build_graph();

};

MapD3.prototype._build_graph = function(){

    var config = this._config;
    var self = this;

    var full_width = parseInt(d3.select(config.container_id).style("width"), 10);
    //var full_height = parseInt(d3.select(config.container_id).style("height"), 10);
    var full_height = Math.max(2*full_width/5, 400);


    this.width =  full_width - config.margin.left - config.margin.right;
    this.height = full_height - config.margin.bottom - config.margin.top;

    config.margin.middle = config.margin.left + this.width /3;

    this._svg = d3.select(config.container_id)
        .append("svg")
        .attr("class", "widget")
        .attr("width", full_width)
        .attr("height", full_height);


    //this._chart = this._svg
    //    .append('g')
    //    .attr("transform", "translate(" + (config.margin.left)  +  "," + config.margin.top + ")");

    var areas = topojson.feature(this.topo, this.topo.objects.collection);

    var projection = d3.geo.albers()
        .center([2.5, 51.2])
        .rotate([4.4, 0])
        .parallels([50, 60])
        .scale(this.width * 20)
        .translate([this.width / 2, this.height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    this._svg.append("path")
        .datum(topojson.feature(this.topo, this.topo.objects.collection))
        .attr("class", "land")
        .attr("d", path);

    this._svg.append("path")
        .datum(topojson.mesh(this.topo, this.topo.objects.collection))
        .attr("class", "boundary",  function(a, b) { return a !== b; })
        .attr("d", path);




};