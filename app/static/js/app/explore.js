define( ['jquery',
         'page',
         'hbars!views/explore',
         'app/navbar',
         'app/explore/map',
         'app/session'
        ], function( $, page, htmlTemplate, navbar, map, session ) {
 	function exploreHandler( ctx, next ) {
 		navbar.showSearch();
		$('#content').html( htmlTemplate() );
        map.initialize( document.getElementById("explore-map-canvas" ), function( err ) {
            if ( err ) {
                $('#content').text( "Failed to load the map, please try again later.")
                return;
            }
            session.request( {
                url: "/api/v0/monitors",
                success: function( monitors ) {
                    map.clearMarkers();
                    var markers = [];
                    for ( var i = 0; i < monitors.length; ++i )
                    {
                        var loc = monitors[i].location;
                        if ( !loc )
                            continue;
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
                        page( '/manage/monitors/' + m.monitor.id );
                    } );
                    map.addMarkers( markers );
                },
                error: function() {
                    map.clearMarkers();
                }
            } );
            next();
        } );
	}

	page( '/explore/*', exploreHandler );
 	//page( '/manage/group/:id', singleGroupHandler );

	//page( '/manage/monitors', monitorsHandler );
	//page( '/manage/monitor/:gsmid', singleMonitorHandler );
	return exploreHandler;
 })