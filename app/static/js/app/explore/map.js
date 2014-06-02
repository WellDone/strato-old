define( ['MarkerClusterer',
         'page'
        ], function( MarkerClusterer, page ) {
  function refreshMap() {
  	this.markerCluster = new MarkerClusterer(this.map, this.markers);
  }
	function initializeMap( container ) {
		require( ['async!https://maps.google.com/maps/api/js?v=3&key=AIzaSyAjsPeRR5wIJrmmEu6a3sbSjVYgFVWbB_c&sensor=false',
			        'app/mapStyle'],
			function( _gmaps, mapStyle ) {
	      this.mapOptions = {
					center: new google.maps.LatLng(9.4969, 36.8961),
					zoom: 3,
					//mapTypeId: 'overview-style',
					draggable:true,
					streetViewControl:false,
					mapTypeControl:false,
					//zoomControl:false,
					panControl:false /*,
					scrollwheel:false,
					disableDoubleClickZoom:true*/
				};

				this.map = new google.maps.Map( container, this.mapOptions);
				//map.mapTypes.set('overview-style', mapStyle);
				this.refresh();
	    } );
	};

	function handleEvent( event, handler ) {
		if ( event === "markerClick" )
			this.onMarkerClick = handler;
	}

	function addMarkers( data ) {
		if ( data.length )
		{
			for (var i = 0; i < data.length; i++) {
			  var latLng = new google.maps.LatLng( data[i].latitude, data[i].longitude);
			  var marker = new google.maps.Marker({'position': latLng});

			  google.maps.event.addListener( marker, 'click', function( d ) {
			  	if ( this.onMarkerClick )
			  		this.onMarkerClick( d );
			  }.bind( this, data[i] ) );

			  this.markers.push(marker);
			}
		}
		this.refresh();
	}
	function clearMarkers() {
		for ( var i = 0; i < this.markers.length; ++i )
			this.markers[i].setMap(null);
		this.markers = [];
		if ( this.markerClusterer )
		{
			this.markerClusterer.clearMarkers();
		}
		this.refresh();
	}

	return {
		map: null,
		markers: [],
		initialize: initializeMap,
		refresh: refreshMap,
		addMarkers: addMarkers,
		clearMarkers: clearMarkers,
		on: handleEvent
	}
})