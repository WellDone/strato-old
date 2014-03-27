define( ['jquery',
         'page',
         'hbars!views/explore',
         'app/navbar',
         'app/explore/map'
        ], function( $, page, htmlTemplate, navbar, map ) {
 	function exploreHandler( ctx, next ) {
 		navbar.showSearch();
		$('#content').html( htmlTemplate() );
    map.initialize( document.getElementById("explore-map-canvas" ) );

    $.getJSON( "/api/v0/monitors", function( monitors ) {
    	map.clearMarkers();
    	var markers = [];
    	for ( var i = 0; i < monitors.length; ++i )
    	{
    		var loc = monitors[i].location;
    		var split = loc.indexOf(",");
    		if ( loc[0] != '(' || loc[loc.length-1] != ')' || split == -1 )
    			continue;
    		var latitude = parseFloat( loc.substr(1,split) );
    		var longitude = parseFloat( loc.substr(split+1) );
    		if ( isNaN( latitude ) || isNaN( longitude ) )
    			continue;

    		var m = {
    			monitor: monitors[i],
    			latitude: latitude,
    			longitude: longitude,
    		}
    		markers.push( m );
    	}
    	map.on( 'markerClick', function( m ) {
    		page( '/manage/monitor/' + m.monitor.id );
    	} );
			map.addMarkers( markers );
		} );
		next();
	}
	page( '/explore/*', exploreHandler );
 	//page( '/manage/group/:id', singleGroupHandler );

	//page( '/manage/monitors', monitorsHandler );
	//page( '/manage/monitor/:gsmid', singleMonitorHandler );
	return exploreHandler;
 })