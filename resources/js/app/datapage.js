/*global WD: false, google: false, $: false */
//google.load('visualization', '1.0', {'packages': ['imageareachart']});

WD.data.drawVisualization = function () {
  /*var query = new google.visualization.Query(
      'http://docs.google.com/a/welldone.org/spreadsheet/tq?key=0Au25JOPkzeVadGxsOWpKQmFyWHhJZHg1NDU0RVRYQ2c&gid=5&headers=-1');

  query.setQuery('SELECT C,D');

  function handleQueryResponse(response) {
    if (response.isError()) {
      console.log('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
      return;
    }

    var data = response.getDataTable();
    WD.data._visualization = new google.visualization.ImageAreaChart( $("#graph_img").get(0) );
    WD.data._visualization.draw(data, {legend: 'bottom'});
  }

  query.send(handleQueryResponse);
  */
  var container = "#datapage_visualization";

  var margin = {top: 20, right: 80, bottom: 30, left: 50},
      width = $(container)[0].offsetWidth - margin.left - margin.right,
      height = $(container)[0].offsetHeight - margin.top - margin.bottom;

  var parseDate = d3.time.format("%Y%m%d").parse;

  var x = d3.time.scale()
      .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  var line = d3.svg.line()
      .interpolate("basis")
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.temperature); });

  $(container).html("");

  var svg = d3.select(container).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //TODO: Load the data beforehand so we don't have to do
  //      another HTTP request every time the browser is resized
  d3.tsv("/resources/dummy_data.tsv", function(error, data) {
    color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

    data.forEach(function(d) {
      d.date = parseDate(d.date);
    });

    var cities = color.domain().map(function(name) {
      return {
        name: name,
        values: data.map(function(d) {
          return {date: d.date, temperature: +d[name]};
        })
      };
    });

    x.domain(d3.extent(data, function(d) { return d.date; }));

    y.domain([
      d3.min(cities, function(c) { return d3.min(c.values, function(v) { return v.temperature; }); }),
      d3.max(cities, function(c) { return d3.max(c.values, function(v) { return v.temperature; }); })
    ]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "-3.5em")
        .style("text-anchor", "end")
        .text("Temperature (ºF)");

    var city = svg.selectAll(".city")
        .data(cities)
      .enter().append("g")
        .attr("class", "city");

    city.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.values); })
        .style("stroke", function(d) { return color(d.name); });

    city.append("text")
        .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
        .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
        .attr("x", 3)
        .attr("dy", ".35em")
        .text(function(d) { return d.name; });
  });
  var resizeTimer;
  $(window).resize( function() {
    clearTimeout( resizeTimer );
    resizeTimer = setTimeout( WD.data.drawVisualization, 100 );
  });
};
