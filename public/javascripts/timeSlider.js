

TimeSlider = function(config){
    this._config = config
    this._bindEvents()
    this._init()


}

TimeSlider.prototype._bindEvents = function(){

    function slider_change(){
        console.log("here");
    }

    ee.addListener("sliderChange", slider_change)

}



 TimeSlider.prototype._init = function(){

     var formatDate = d3.time.format("%Y");

     // parameters
     var margin = {
     top: 50,
     right: 50,
     bottom: 50,
     left: 50
     },
     width = parseInt(d3.select(this._config.container).style("width"), 10) - margin.left - margin.right,
     height = parseInt(d3.select(this._config.container).style("width"), 10)/4 - margin.bottom - margin.top;


     // scale function
     //var timeScale = d3.time.scale()
     //    .domain([new Date('2008-01-01'), new Date('2013-01-01')])
     //    .range([0, width])
     //    .clamp(true)
     //    .nice(5);

     var xScale = d3.scale.linear()
         .domain([2008, 2013])
         .range([0, width])
         .clamp(true)
         .nice(10);


     // initial value
     //var startValue = timeScale(new Date('2012-01-01'));
     //var startingValue = new Date('2012-01-01');

     var startingValue = controller._current_period;

     var startValue = xScale(startingValue);



     // defines brush
     var brush = d3.svg.brush()
         //.x(timeScale)
         .x(xScale)
         .extent([startingValue, startingValue])
         .on("brush", function() {
             var value = brush.extent()[0];

             if (d3.event.sourceEvent) { // not a programmatic event
                 //value = timeScale.invert(d3.mouse(this)[0]);
                 value = xScale.invert(d3.mouse(this)[0])
                 //controller._apply_filter("period", value);
                 //have to check if time has changed??
                 //have to map to check what time format and map to that??

                 //value = timeScale.invert(140)
                 brush.extent([value, value]);

             }

             //handle.attr("transform", "translate(" + timeScale(value) + ",0)");
             handle.attr("transform", "translate(" + xScale(value) + ",0)");
             //handle.select('text').text(formatDate(value));

             handle.select('text').text(Math.round(value));
             controller._period_change(Math.round(value));
        });


     var svg = d3.select(this._config.container)
         .append("svg")
         .attr("width", width + margin.left + margin.right)
         .attr("height", height + margin.top + margin.bottom)
         .append("g")
         // classic transform to position g
         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

     svg.append("g")
         .attr("class", "slider x axis")
         // put in middle of screen
         .attr("transform", "translate(0," + height / 2 + ")")
         // introduce axis
         .call(d3.svg.axis()
         //.scale(timeScale)
         .scale(xScale)
         .orient("bottom")
         .tickFormat(function(d) {
            return d
            //return formatDate(d);
         })
         .tickSize(0)
         .tickPadding(12)
         //.tickValues([timeScale.domain()[0], timeScale.domain()[1]]))
         .tickValues([xScale.domain()[0], xScale.domain()[1]]))
         .select(".domain")
         .select(function() {
         //console.log(this);
             return this.parentNode.appendChild(this.cloneNode(true));
         })
         .attr("class", "halo")
         .style("stoke", "black");

     var slider = svg.append("g")
         .attr("class", "slider")
         .call(brush);

     slider.selectAll(".extent,.resize")
        .remove();

     slider.select(".background")
        .attr("height", height);

     var handle = slider.append("g")
        .attr("class", "handle")

     handle.append("path")
         .attr("transform", "translate(0," + height / 2 + ")")
         .attr("d", "M 0 -10 V 10")

     handle.append('text')
         .text(startingValue)
         .attr("transform", "translate(" + (-18) + " ," + (height / 2 - 15) + ")");

     slider
        .call(brush.event)

/*
*/

 };
