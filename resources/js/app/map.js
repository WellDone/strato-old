function MoMoSite( siteName, countryName, monitorList ) {
	this.name = siteName;
	this.country = countryName;
	this.monitors = [];
	this._markers = [];

	if ( monitorList ) {
		for ( var i=0; i<monitorList.length; ++i ) {
			this.addMonitor( monitorList[i] );
		}
	}
}
MoMoSite.prototype = {
	addMonitor : function( monitor ) {
		if ( !monitor.name || !monitor.loc )
			return;
		this.monitors.push( monitor );
		this._markers.push( new google.maps.Marker({
	    position: monitor.loc,
	    title: monitor.name
		}) );
	},
	getCenter : function() {
		var alat = 0,
		    alng = 0;
		for ( var i=0; i<this.monitors.length; ++i ) {
			alat += this.monitors[i].loc.lat();
			alng += this.monitors[i].loc.lng();
		}
		alat /= this.monitors.length;
		alng /= this.monitors.length;
		return new google.maps.LatLng( alat, alng );
	},
	makeBounds : function() {
		var TL = {lat: null, lng:null};
		var BR = {lat: null, lng:null};
		for ( var i=0; i<this.monitors.length; ++i ) {
			var loc = this.monitors[i].loc;
			TL.lat = (TL.lat)? Math.min( TL.lat,loc.lat() ) : loc.lat();
			TL.lng = (TL.lng)? Math.min( TL.lng,loc.lng() ) : loc.lng();
			BR.lat = (BR.lat)? Math.max( BR.lat,loc.lat() ) : loc.lat();
			BR.lng = (BR.lng)? Math.max( BR.lng,loc.lng() ) : loc.lng();
		}
		return new google.maps.LatLngBounds( new google.maps.LatLng( TL.lat, TL.lng ),
																				 new google.maps.LatLng( BR.lat, BR.lng ) );
	},
	showMarkers : function( _map ) {
		for ( var i=0; i<this._markers.length; ++i ) {
			this._markers[i].setMap( _map );
		}
	},
	hideMarkers : function() {
		for ( var i=0; i<this._markers.length; ++i ) {
			this._markers[i].setMap( null );
		}
	}
}

function MoMoCountryLayer( siteMap ) {
	this.sitesByCountry = {}
	this.countryNameList = [];
	for ( var siteName in siteMap )
	{
		if ( !siteMap.hasOwnProperty( siteName ) )
			continue;

		var site = siteMap[siteName];
		var countryName = site.country;
		if ( !this.sitesByCountry[ countryName ] )
			this.sitesByCountry[ countryName ] = [];

		this.sitesByCountry[ countryName ].push( site )
		this.countryNameList.push( countryName ); // The case must match exactly
	}
	var whereClause = "name IN ('" + this.countryNameList.join("','") + "')";
	this._layer = new google.maps.FusionTablesLayer( {
		query: {
	    select: "'col29'",
	    from: '1uKyspg-HkChMIntZ0N376lMpRzduIjr85UYPpQ',
	    where: whereClause
    },
    suppressInfoWindows: true
	} );
	google.maps.event.addListener(this._layer, 'click', this.onClick.bind(this) );
}

MoMoCountryLayer.prototype = {
	show : function( _map ) {
		this._layer.setMap( _map );
	},
	hide : function() {
		this._layer.setMap( null );
	},
	showCountry : function( countryName ) {
		this._layer.setOptions({
	    styles: [ {
		    	polygonOptions: { fillOpacity: 0.3 },
		    	where: "name = '" + countryName + "'"
		    },{
		    	polygonOptions: {fillOpacity: 0.1 },
		    	where: "name NOT EQUAL TO '" + countryName + "'"
		    }]
	  });
	},
	showAllCountries : function() {
		var whereClause = "name IN ('" + this.countryNameList.join("','") + "')";
		this._layer.query.where = whereClause
		this._layer.setOptions({
	    styles: [ {
	    	polygonOptions: { fillOpacity: 0.5 }
	    }]
	  });
	},
	onClick : function(e) {
		this.hide();
		var countryName = e.row["name"].value;
		var sites = this.sitesByCountry[ countryName ];
		var monitorCount = 0;
		var siteLinks = [];

		hideAllSites();
		goToCountry( countryName );
		for ( var i=0; i<sites.length; ++i ) {
			monitorCount += sites[i].monitors.length;
			siteLinks.push( "<a href='#' onClick='javascript:goToSite(window.sites[\"" + sites[i].name + "\"]);'>" + sites[i].name + "</a>" );
			showSite( sites[i] );
		}
		/*e.infoWindowHtml = "<strong>" + countryName + "</strong><br/>"
		                  + sites.length + " monitoring sites.<br/>"
		                  + monitorCount + " sensor units<br/><br/>"
		                  + siteLinks.join("<br/>");*/
		if ( monitorCount == 0 )
			console.log( "No monitors at this site!" );

		setTimeout( this.show.bind(this, map), 200);
	}
}

function MoMo( monitorName, monitorLocation )
{
	this.name = monitorName;
	this.loc = monitorLocation;
}

window.sites = {};
function AddSite( name, country, monitors )
{
	if ( window.sites[name] )
		return;
	window.sites[name] = new MoMoSite( name, country, monitors );
}
AddSite( "Some Kenyan Village", "Kenya", [
			new MoMo( "Olenguruone District Hospital", new google.maps.LatLng(-0.59103333333, 35.68551667) ),
			new MoMo( "Mogotio Clinic", new google.maps.LatLng(-0.024783, 35.966767) ),
			new MoMo( "ABC Kanyuuni School", new google.maps.LatLng(1.10015, 38.07315) )
		]);
AddSite( "Charity:Water Pilot 2013", "Ethiopia", [
			
		]);
AddSite( "Nepal Pilot 2013", "Nepal", [
			
		]);

function loadMap()
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
	      { visibility: 'on' }
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
	window.overviewOptions = {
	  center: new google.maps.LatLng(9.4969, 36.8961),
	  zoom: 2,
	  mapTypeId: 'overview-style',
	  draggable:true,	
	  streetViewControl:false,
	  mapTypeControl:false,
	  zoomControl:false,
	  panControl:false,
	  disableDoubleClickZoom:true
	};

	window.map = new google.maps.Map(document.getElementById("map_canvas"), overviewOptions);
	var styledOverviewMapType = new google.maps.StyledMapType(overviewStyle, {
	  map: map,
	  name: 'Styled Map'
	});
	map.mapTypes.set('overview-style', styledOverviewMapType);
	window.countryLayer = new MoMoCountryLayer( window.sites );
	window.currentSites = [];

	goToOverview();
}

function goToOverview()
{
	hideAllSites();
	window.countryLayer.showAllCountries();
	window.map.setOptions(overviewOptions);
	window.countryLayer.show( map );
}

function goToCountry( countryName )
{
	var geocoder = new google.maps.Geocoder();
   geocoder.geocode( { 'address': countryName}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        map.fitBounds(results[0].geometry.viewport);
      }
    });
	window.map.setOptions({draggable:false});
	window.countryLayer.showCountry( countryName );
}

function hideAllSites()
{
	for ( var i=0; i<window.currentSites.length; ++i ) {
		window.currentSites[i].hideMarkers();
	}
	window.currentSites = [];
}

function showSite( site )
{
	window.currentSites.push( site );
	site.showMarkers( map );
}

//var zoomIn = function(){ window.map.setZoom(window.map.getZoom() + 1); }