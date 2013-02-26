/*global WD: false, google: false, $: false, d3: false, alert: false */

WD.dataPage = {};
WD.dataPage.visualizationContainer = "#datapage_visualization";
WD.dataPage._resizeTimer = null;
WD.dataPage.drawVisualization = function ( siteID ) {
  var container = WD.dataPage.visualizationContainer;
  var margin = {top: 20, right: 30, bottom: 30, left: 50},
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
      .y(function(d) { return y(d.volume); });

  $(container).html("");

  var svg = d3.select(container).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  function redraw( data ) {
    var monitors = color.domain().map(function(name) {
      return {
        name: name,
        values: data.map(function(d) {
          return {date: d.date, volume: +d[name]};
        })
      };
    });

    x.domain(d3.extent(data, function(d) { return d.date; }));

    y.domain([
      d3.min(monitors, function(c) { return 0;}),//d3.min(c.values, function(v) { return v.volume; }); }),
      d3.max(monitors, function(c) { return d3.max(c.values, function(v) { return v.volume; }); })
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
        .text("Volume (L)");

    var city = svg.selectAll(".city")
        .data(monitors)
      .enter().append("g")
        .attr("class", "city");

    city.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.values); })
        .style("stroke", function(d) { return color(d.name); });

  /*city.append("text")
        .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
        .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
        .attr("x", 3)
        .attr("dy", ".35em")
        .text(function(d) { return d.name; });*/
  }

  //TODO: Load the data beforehand so we don't have to do
  //      another HTTP request every time the browser is resized
  d3.json("/data/sites/" + siteID + "/reports.json", function(error, data) {
    if ( error ) {
      console.log( error );
      return;
    }
    color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

    data.forEach(function(d) {
      d.date = parseDate(d.date);
    });

    redraw( data );
  });
  $(window).resize( function() {
    clearTimeout( WD.dataPage._resizeTimer );
    WD.dataPage._resizeTimer = setTimeout( WD.dataPage.drawVisualization, 100);
  });
};

WD.dataPage._markers = [];
WD.dataPage.loadMap = function( siteData ) {
  var i;
  var mapOptions = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    draggable:false,
    streetViewControl:false,
    mapTypeControl:false,
    zoomControl:false,
    panControl:false,
    scrollwheel:false,
    disableDoubleClickZoom:true
  };
  WD.dataPage._map = new google.maps.Map(document.getElementById("datapage_map"), mapOptions);

  WD.dataPage._map.setCenter( siteData.getCenter() );
  WD.dataPage._map.fitBounds( siteData.makeBounds() );

  for ( i=0; i<siteData.monitors.length; ++i ) {
    var momo = siteData.monitors[i];
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng( momo.loc.lat, momo.loc.lng ),
      title: momo.name,
      map: WD.dataPage._map
    });

    WD.dataPage._markers.push( marker );
    google.maps.event.addListener(marker, 'click', function() {
      //TODO

    } );
  }
};

WD.dataPage.render = function( siteID ) {
  WD.data.sites.get( siteID, function( siteData ) {
    WD.util.templates.renderTemplate( "datapage", function(data, template) {
      $("#data_section").hide();
      $("#data_section").html( template( data ) );
      setTimeout( function(){ $("#data_section").show(); }, 100);
      setTimeout( function( data ) {
        WD.dataPage.drawVisualization( siteID );
        WD.dataPage.loadMap( data );
      }.bind(null, data), 200 );
    }.bind(null, siteData), function(err){alert(err);});

    WD.nav.set( siteData.country, siteData.name );
  }, function() {
    alert( "Site not found!" );
  } );
};