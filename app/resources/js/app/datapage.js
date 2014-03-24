/*global WD: false, google: false, $: false, d3: false, alert: false */

WD.dataPage = {};
WD.dataPage.visualizationContainer = "#datapage_visualization";
WD.dataPage._resizeTimer = null;
WD.dataPage.color = d3.scale.category10();
WD.dataPage.drawVisualization = function () {
  var container = WD.dataPage.visualizationContainer;
  var margin = {top: 20, right: 30, bottom: 30, left: 50},
      width = $(container)[0].offsetWidth - margin.left - margin.right,
      height = $(container)[0].offsetHeight - margin.top - margin.bottom;
//Sun Aug 18 2013 14:00:16 GMT+0300 (EAT)
  var x = d3.time.scale()
      .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

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

  WD.dataPage.redraw = function() {
    var monitors = WD.dataPage.color.domain().map(function(name) {
      return {
        name: name,
        values: WD.dataPage.data.map(function(d) {
          return {date: d.date, volume: +d[name]};
        })
      };
    });

    x.domain(d3.extent(WD.dataPage.data, function(d) { return d.date; }));

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
        .text("Event Count");

    var monitor = svg.selectAll(".monitor")
        .data(monitors)
      .enter().append("g")
        .attr("class", "monitor");

    monitor.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.values); })
        .style("stroke", function(d) { return WD.dataPage.color(d.name); })
        .on( "mouseover", function(d,i) { WD.dataPage.selectMonitor( i ); } )
        .on( "mouseout", function(d,i) { WD.dataPage.deselectMonitor( i ); });

  /*city.append("text")
        .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
        .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
        .attr("x", 3)
        .attr("dy", ".35em")
        .text(function(d) { return d.name; });*/
  }
  WD.dataPage.redraw();

  $(window).resize( function() {
    clearTimeout( WD.dataPage._resizeTimer );
    WD.dataPage._resizeTimer = setTimeout( WD.dataPage.drawVisualization, 100);
  });
};

WD.dataPage.loadDataForVisualization = function( siteID, siteData, callback ) {
  d3.json("/data/sites/" + siteID + "/reports.json", function(error, data) {
    if ( error ) {
      console.log( error );
      return;
    }

    WD.dataPage.IDToIndexMap = {};
    for ( var index = 0; index < siteData.monitors.length; ++index )
    {
      WD.dataPage.IDToIndexMap[siteData.monitors[index].id] = index;
    }

    WD.dataPage.data = [];
    data.forEach(function(d) {
      var o = {};
      for ( var id in WD.dataPage.IDToIndexMap ) {
        var index = WD.dataPage.IDToIndexMap[id];
        if ( d[id] )
          o[index] = d[id];
        else
          o[index] = undefined;
      }
      o.date = new Date(d.date);
      WD.dataPage.data.push( o );
    });

    if ( WD.dataPage.socket ) {
      WD.dataPage.socket.emit( 'clear monitors' );
    } else {
      WD.dataPage.socket = io.connect(window.location.hostname);
    }
    for ( i=0; i<siteData.monitors.length; ++i ) {
      WD.dataPage.socket.emit( 'watch monitor', siteData.monitors[i].id );
    }
    
    WD.dataPage.socket.on('newReport', function (newData) {
      newData.date = new Date( newData.date );
      var index = WD.dataPage.IDToIndexMap[newData.monitor];
      if ( !index && index !== 0 )
        return;

      var i;
      for ( i = 0; i < WD.dataPage.data.length; ++i ) {
        if ( WD.dataPage.data[i].date == newData.date ) {
          WD.dataPage.data[i][index] = newData.eventCount;
          break;
        }
      }
      if ( i == WD.dataPage.data.length ) {
        var obj = { date: newData.date };
        obj[index] = newData.eventCount;
        WD.dataPage.data.push( obj );
      }
      WD.dataPage.drawVisualization();
    });
    WD.dataPage.socket.on('clear', function(monitorid) {
      WD.dataPage.render( siteID );
    })

    callback( WD.dataPage.data );
  });
}

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

  WD.dataPage._markers.forEach( function( m ) { m.setMap( null ); });
  WD.dataPage._markers = [];
  for ( i=0; i<siteData.monitors.length; ++i ) {
    var momo = siteData.monitors[i];
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng( momo.loc.lat, momo.loc.lng ),
      title: momo.name,
      icon: '/resources/images/icon2.png',
      map: WD.dataPage._map
    });

    WD.dataPage._markers.push( marker );
    google.maps.event.addListener(marker, 'click', function() {
      //TODO

    } );
    google.maps.event.addListener(marker, 'mouseover', function( i ) {
      WD.dataPage.selectMonitor( i );
    }.bind(null, i));
    google.maps.event.addListener(marker, 'mouseout', function( i ) {
      WD.dataPage.deselectMonitor( i );
    }.bind(null, i));
  }
};

WD.dataPage.selectMonitor = function( i ) {
  if ( WD.dataPage._markers[i] ) // Don't break if we don't have an internet connection
    WD.dataPage._markers[i].setIcon( 'resources/images/icon2-dark.png' );
  $("ul li").eq(i).addClass("highlighted");
  d3.selectAll( "g.monitor" ).filter( function(d, j){
    return j===i?this:null;
  }).select("path").style( "stroke-width", "3px" );
}
WD.dataPage.deselectMonitor = function( i ) {
  if ( WD.dataPage._markers[i] ) // Don't break if we don't have an internet connection
    WD.dataPage._markers[i].setIcon( 'resources/images/icon2.png' );
  $("ul li").eq(i).removeClass("highlighted");
  d3.selectAll( "g.monitor" ).filter( function(d, j){
    return (j===i)?this:null;
  }).select("path").style( "stroke-width", "1.5px" );
}

function extendSiteData( siteData, monitorData ) {
  siteData.runningAverage = 0;
  var dates = {};
  var dateCount = 0;
  for ( var i = 0; i < monitorData.length; ++i ) {
    var data = monitorData[i]
    var date = data.date;//{year: data.date.getYear(), month: data.date.getMonth(), day: data.date.getDate() };
    if ( !dates[date] ) {
      dates[date] = [];
      dateCount++;
    }
    for (m in data) {
      if ( m != "date" )
        dates[date].push( data[m] );
    }
  }
  for (d in dates) {
    var sum = 0;
    for ( v in dates[d] ) {
      if ( !isNaN( dates[d][v] ) )
        sum += dates[d][v];
    }
    dates[d] = sum / dates[d].length;
    siteData.runningAverage += dates[d];
  }
  if ( dateCount > 0 )
    siteData.runningAverage /= dateCount;
  siteData.runningAverage = siteData.runningAverage.toFixed(2);

  //siteData.volumePerCapita = siteData.runningAverage * 1.5; // assumes //(Math.random() * 6 + 17).toFixed(2);
  siteData.averageVolume = (siteData.runningAverage * 1).toFixed(2); //Math.ceil( siteData.volumePerCapita * siteData.population );
  if ( !siteData.population ) {
    siteData.population = Math.ceil( Math.random() * 15 );
  }
  siteData.volumePerCapita = (siteData.averageVolume / siteData.population).toFixed(2);
  siteData.health = Math.ceil( siteData.volumePerCapita / 3 * 100 );
}
WD.dataPage.render = function( siteID ) {
  WD.data.sites.get( siteID, function( siteData ) {
    WD.dataPage.loadDataForVisualization( siteID, siteData, function(data) {
      extendSiteData( siteData, WD.dataPage.data );

      WD.util.templates.renderTemplate( "datapage", function(data, template) {
        $("#data_section").hide();
        $("#data_section").html( template( data ) );
        setTimeout( function(){ $("#data_section").show(); }, 100);
        setTimeout( function( data ) {
          WD.dataPage.color.domain( d3.range( data.monitors.length ) );
          for ( var i=0; i<data.monitors.length; ++i ) {
            var el = $("ul li").eq(i);
            el.css( "color", WD.dataPage.color(i) );
            el.mouseover( function(i) {
              WD.dataPage.selectMonitor( i );
            }.bind(null, i)).mouseout( function(i) {
              WD.dataPage.deselectMonitor( i );
            }.bind(null, i))
            WD.dataPage.drawVisualization();
          }
          if ( window.google ) {
            WD.dataPage.loadMap( data );
          }
        }.bind(null, data), 200 );
      }.bind(null, siteData), function(err){alert(err);});
    } );

    WD.nav.set( siteData.country, siteData.name );
  }, function() {
    alert( "Site not found!" );
  } );
};
