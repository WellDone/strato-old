/*global WD: false, google: false, $: false */

WD.map = {
	_markers : []
};

WD.map.CountryLayer = function( siteMap ) {
	var siteName, site, countryName, whereClause;
	this.countryNameList = [];
	for ( siteName in siteMap )
	{
		if ( siteMap.hasOwnProperty( siteName ) ) {
			site = siteMap[siteName];
			countryName = site.country;
			this.countryNameList.push( countryName ); // The case must match exactly
		}
	}
	whereClause = "name IN ('" + this.countryNameList.join("','") + "')";
	this._layer = new google.maps.FusionTablesLayer( {
		query: {
	    select: "'col29'",
	    from: '1uKyspg-HkChMIntZ0N376lMpRzduIjr85UYPpQ'//,
	    //where: whereClause
    },
    suppressInfoWindows: true
	} );
	google.maps.event.addListener(this._layer, 'click', this.onClick.bind(this) );
};

WD.map.CountryLayer.prototype = {
	show : function( _map ) {
		this._layer.setMap( _map );
	},
	hide : function() {
		this._layer.setMap( null );
	},
	showCountry : function( countryName ) {
		var whereClause = "name IN ('" + this.countryNameList.join("','") + "')";
		this._layer.setOptions({
	    styles: [ {
	    	polygonOptions: {fillOpacity: 0.0001, strokeColor: "#000000", strokeOpacity:0.2 }
	    },{
		    	polygonOptions: { fillOpacity: 0.3, fillColor: "#0000FF" },
		    	where: "name = '" + countryName + "'"
		    },{
		    	polygonOptions: {fillOpacity: 0.1, fillColor: "#0000FF" },
		    	where: whereClause + "AND name NOT EQUAL TO '" + countryName + "'"
		    }]
	  });
	},
	showAllCountries : function() {
		var whereClause = "name IN ('" + this.countryNameList.join("','") + "')";
		this._layer.setOptions({
	    styles: [ {
	    	polygonOptions: {fillOpacity: 0.0001, strokeColor: "#000000", strokeOpacity:0.2 }
	    },{
	    	polygonOptions: { fillOpacity: 0.4, fillColor: "#0000FF", strokeOpacity: 0.7 , strokeColor: "#000000" },
	    	where: whereClause
	    }]
	  });
	},
	onClick : function(e) {
		var countryName = e.row.name.value;
		if ( WD.map.currentCountry != countryName ) {
			WD.map.hideAllSites();
			WD.router.setRoute( "country/" + countryName );
		}
	}
};

WD.map.loadMap = function()
{
	var overviewStyle = [
	  {
	    featureType: 'all',
	    elementType: 'all',
	    stylers: [
	      { saturation: -60 }
	    ]
	  },
	  {
	    featureType: 'road.highway',
	    elementType: 'all',
	    stylers: [
	      { visibility: 'off' }
	    ]
	  },
	  {
	    featureType: 'road.arterial',
	    elementType: 'all',
	    stylers: [
	      { visibility: 'off' }
	    ]
	  },
	  {
	    featureType: 'road.local',
	    elementType: 'all',
	    stylers: [
	      { visibility: 'off' }
	    ]
	  },
	  {
	    featureType: 'administrative.country',
	    elementType: 'all',
	    stylers: [
	      { visibility: 'off' }
	    ]
	  },
	  {
	    featureType: 'administrative.province',
	    elementType: 'all',
	    stylers: [
	      { visibility: 'off' }
	    ]
	  },
	  {
	    featureType: 'administrative.locality',
	    elementType: 'all',
	    stylers: [
	      { visibility: 'off' }
	    ]
	  },
	  {
	    featureType: 'administrative.neighborhood',
	    elementType: 'all',
	    stylers: [
	      { visibility: 'off' }
	    ]
	  },
	  {
	    featureType: 'administrative.land_parcel',
	    elementType: 'all',
	    stylers: [
	      { visibility: 'off' }
	    ]
	  },
	  {
	    featureType: 'poi',
	    elementType: 'all',
	    stylers: [
	      { visibility: 'off' }
	    ]
	  },
	  {
	    featureType: 'transit',
	    elementType: 'all',
	    stylers: [
	      { visibility: 'off' }
	    ]
	  }
	];
	WD.map.overviewOptions = {
	  center: new google.maps.LatLng(9.4969, 36.8961),
	  zoom: 3,
	  mapTypeId: 'overview-style',
	  draggable:true,
	  streetViewControl:false,
	  mapTypeControl:false,
	  zoomControl:false,
	  panControl:false,
	  scrollwheel:false,
	  disableDoubleClickZoom:true
	};

	WD.map._map = new google.maps.Map(document.getElementById("map_canvas"), WD.map.overviewOptions);
	var styledOverviewMapType = new google.maps.StyledMapType(overviewStyle, {
	  map: WD.map._map,
	  name: 'Styled Map'
	});
	WD.map._map.mapTypes.set('overview-style', styledOverviewMapType);
	WD.map._CountryLayer = new WD.map.CountryLayer( WD.data.sites );
	WD.currentSites = [];
};

WD.map.goToOverview = function()
{
	WD.map.hideAllSites();
	WD.map._CountryLayer.showAllCountries();
	WD.map._map.setOptions(WD.map.overviewOptions);
	WD.map._CountryLayer.show( WD.map._map );
	WD.map.currentCountry = null;
};

WD.map.goToCountry = function( countryName )
{
	var i,
	    geocoder = new google.maps.Geocoder();
   geocoder.geocode( { 'address': countryName}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        WD.map._map.setCenter(results[0].geometry.location);
        WD.map._map.fitBounds(results[0].geometry.viewport);
      }
    });
	WD.map._map.setOptions({draggable:false});
	WD.map._CountryLayer.showCountry( countryName );
	WD.map._CountryLayer.show( WD.map._map );

	var monitorCount = 0;
	WD.data.sites.forEach( function( site ) {
		if ( site.country === countryName ) {
			monitorCount += site.monitors.length;
			WD.map.showSite( site );
		}
	});
	if ( monitorCount === 0 ) {
		console.log( "No monitors at this site!" );
	}
	WD.map.currentCountry = countryName;
};

WD.map.hideAllSites = function()
{
	var i;
	for ( i=0; i<WD.map._markers.length; ++i ) {
		WD.map._markers[i].setMap( null );
	}
	WD.map.currentSites = [];
	WD.map._markers = [];
};

WD.map.showSite = function( site )
{
	WD.currentSites.push( site );
	var marker = new google.maps.Marker({
    position: site.getCenter(),
    title: site.name,
    map: WD.map._map
	});

	WD.map._markers.push( marker );
	google.maps.event.addListener(marker, 'click', function() {
		WD.router.setRoute( "site/" + site.id );

	} );
};
