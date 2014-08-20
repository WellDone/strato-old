define( [ 'jquery',
          'hbars!views/manage/monitor',
          'moment',
          'd3',
          'rickshaw',
          'app/session',
          'app/alerts' ],
 function ( $, template, moment, d3, Rickshaw, session, alerts ) {
 	
 	function render( monitor ) {
		$( '#manage-content' ).html( template( monitor ) )

		$('#deleteModal').modal( { show: false } );

		if ( session.resourcePermissions('reports').del )
		{
			$( '#clear-reports-button' ).removeClass( 'hidden' );
			$( '#clear-reports-button' ).click( function( e ) {
				e = e || window.event;
				e.preventDefault();
				e.stopPropagation();

				$( '#deleteModal').modal('show');
				var delFunc = function() {
					monitor.reports.forEach( function( r ) {
						session.request({
							url: '/api/v0/reports/' + r.id,
							type: 'DELETE'
						});
					})
					monitor.reports = [];
					render( monitor )
					$( '#delete-modal').modal('hide');
					//TODO: These shouldn't be needed, but they are.
					$('body').removeClass('modal-open');
					$('.modal-backdrop').remove();
					$( '#actually-delete-button').off( 'click', delFunc );
				}
				
				$( '#deleteModal').modal('show');
				$( '#actually-delete-button').on( 'click', delFunc );
			} );
		}
		else
		{
			$( '#clear-reports-button' ).addClass( 'hidden' );
		}

		//var svg = dimple.newSvg('#chartContainer', 590, 400);
		var data = {};
		var aggCount = 0;
		data['flow (L/s)'] = [];
		++aggCount;
		monitor.reports.forEach( function(x, r) {
			if ( !x.data || !x.data.intervalAggregates )
				return;

			var step = x.data.interval.step;
			switch ( x.data.interval.type )
			{
				case 0: //second
					break;
				case 1: //minute
					step *= 60;
					break;
				case 2: //hour
					step *= 3600;
					break;
				case 3:
					step *= 3600 * 24;
					break;
				default:
					break; //this should be an error
			}

			var baseDate = moment( x.timestamp, 'YYYY MMMM DD h:mm:ss a' ).subtract( 's', step * x.data.interval.count )

			for ( var i = 0; i < x.data.intervalAggregates.length; ++i )
			{
				var date = baseDate.add( 's', step ).unix();
				data['flow (L/s)'].push( {
					x: date,
					y: x.data.intervalAggregates[i]['mean'] * 2 / 65
				} );
				// for ( var a in x.data.intervalAggregates[i] )
				// {
				// 	if ( a == 'count' )
				// 		continue;
				// 	if ( !data[a] )
				// 	{
				// 		data[a] = [];
				// 		++aggCount;
				// 	}
				// 	data[a].push( {
				// 		x: date,
				// 		y: x.data.intervalAggregates[i][a]
				// 	} );
				// }
			}
		} );

		if ( !data['flow (L/s)'] || data['flow (L/s)'].length == 0 )
		{
			$('#chart_container').html( "No data available..." );
			return;
		}
    
    var palette = new Rickshaw.Color.Palette();

		// instantiate our graph!
		var seriesData = [];
		for ( var a in data ) {
			seriesData.push( { 
				color: palette.color(),
				data: data[a],
				name: a
			} );
		}

		var graph = new Rickshaw.Graph( {
			element: document.getElementById("chart"),
			width: 900,
			height: 500,
			renderer: 'line',
			stroke: true,
			preserve: true,
			interpolation: 'linear',
			series: seriesData
		} );

		graph.window.xMax = graph.dataDomain()[1];
		graph.window.xMin = graph.window.xMax - (24*60*60); // One day

		graph.render();

		var preview = new Rickshaw.Graph.RangeSlider.Preview( {
			graph: graph,
			element: document.getElementById('preview'),
		} )

		var hoverDetail = new Rickshaw.Graph.HoverDetail( {
			graph: graph,
			xFormatter: function(x) {
				return new Date(x * 1000).toString();
			}
		} );

		var annotator = new Rickshaw.Graph.Annotate( {
			graph: graph,
			element: document.getElementById('timeline')
		} );

		/*var legend = new Rickshaw.Graph.Legend( {
			graph: graph,
			element: document.getElementById('legend')

		} );

		var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
			graph: graph,
			legend: legend
		} );

		var order = new Rickshaw.Graph.Behavior.Series.Order( {
			graph: graph,
			legend: legend
		} );

		var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight( {
			graph: graph,
			legend: legend
		} );*/

		var ticksTreatment = 'glow';

		var xAxis = new Rickshaw.Graph.Axis.Time( {
			graph: graph,
			ticksTreatment: ticksTreatment,
			timeFixture: new Rickshaw.Fixtures.Time.Local()
		} );

		xAxis.render();

		var yAxis = new Rickshaw.Graph.Axis.Y( {
			graph: graph,
			tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
			ticksTreatment: ticksTreatment
		} );

		yAxis.render();

		var previewXAxis = new Rickshaw.Graph.Axis.Time({
			graph: graph,
			timeFixture: new Rickshaw.Fixtures.Time.Local(),
			ticksTreatment: ticksTreatment
		});

		previewXAxis.render();

    // var myChart = new dimple.chart(svg, data);
    // myChart.setBounds(60, 30, 505, 305);
    // var x = myChart.addTimeAxis("x", "date", "%Y%m%d%H%M%S", "%b %d %H:%M:%S");
    // x.timePeriod = d3.time.minutes;
    // x.timeInterval = 1;
    // myChart.addMeasureAxis("y", "value");
    // myChart.addSeries(["aggregate"], dimple.plot.bar);
    // myChart.addLegend(60, 10, 500, 20, "right");
    // myChart.draw();

    var chartResizer = function( windowSize, e ) {
    	e.preventDefault();
    	
    	graph.window.xMax = graph.dataDomain()[1];
			graph.window.xMin = graph.window.xMax - (windowSize);

			graph.render();
    }

    $( '#chart_control' ).find( "[href='#year']" ).click( chartResizer.bind( null, 24*60*60*365 ) );
    $( '#chart_control' ).find( "[href='#month']" ).click( chartResizer.bind( null, 24*60*60*30 ) );
    $( '#chart_control' ).find( "[href='#week']" ).click( chartResizer.bind( null, 24*60*60*7 ) );
    $( '#chart_control' ).find( "[href='#day']" ).click( chartResizer.bind( null, 24*60*60 ) );
	}

	function init( id ) {
	 	session.getJSON( '/api/v0/monitors/' + id, function ( monitor ) { //TODO: parallelize
			session.getJSON( '/api/v0/monitors/' + id + '/reports?order=timestamp', function( reports ) {
				reports.forEach( function( r ) {
					r.timestamp = moment( r.timestamp ).format( 'YYYY MMMM DD h:mm:ss a' );
					if ( r.data.bulkAggregates.min == 65535 )
						r.data.bulkAggregates.min = "<none>"
					if ( r.data.bulkAggregates.max == 0 )
						r.data.bulkAggregates.max = "<none>"
				})
				monitor.reports = reports;
				render( monitor )
			});
		},
		function( err ) {
			if ( err.status == 404 )
				$('#manage-content').html( "Monitor not found!  <br/><br/><a href='/manage/monitors'>List all monitors</a>" );
			else
				$('#manage-content').html( "An unexpected error occurred. This event has been recorded and WellDone Technical Support is on the case.")
		} );
	}

 	return function( ctx ) {
 		init( ctx.params.id );
 	}
 } );