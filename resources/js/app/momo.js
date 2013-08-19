/*global WD: false, google: false,  */

WD.MoMo = {};

WD.MoMo.Monitor = function( id, monitorName, monitorLocation )
{
	this.id = id,
	this.name = monitorName;
	this.loc = monitorLocation;
};

WD.MoMo.Site = function( siteName, countryName, monitorList ) {
	var i;
	this.name = siteName;
	this.country = countryName;
	this.monitors = [];

	if ( monitorList ) {
		for ( i=0; i<monitorList.length; ++i ) {
			this.addMonitor( monitorList[i] );
		}
	}
};
WD.MoMo.Site.prototype = {
	addMonitor : function( monitor ) {
		if ( (!monitor.id && monitor.id != 0) || !monitor.name || !monitor.loc ) {
			return;
		}
		this.monitors.push( monitor );
	},
	getCenter : function() {
		var alat = 0,
		    alng = 0,
		    i;
		for ( i=0; i<this.monitors.length; ++i ) {
			alat += this.monitors[i].loc.lat;
			alng += this.monitors[i].loc.lng;
		}
		alat /= this.monitors.length;
		alng /= this.monitors.length;
		return new google.maps.LatLng( alat, alng );
	},
	makeBounds : function() {
		var TL = {lat: null, lng:null},
		    BR = {lat: null, lng:null},
		    i;
		for ( i=0; i<this.monitors.length; ++i ) {
			var loc = this.monitors[i].loc;
			TL.lat = (TL.lat)? Math.min( TL.lat,loc.lat ) : loc.lat;
			TL.lng = (TL.lng)? Math.min( TL.lng,loc.lng ) : loc.lng;
			BR.lat = (BR.lat)? Math.max( BR.lat,loc.lat ) : loc.lat;
			BR.lng = (BR.lng)? Math.max( BR.lng,loc.lng ) : loc.lng;
		}
		return new google.maps.LatLngBounds( new google.maps.LatLng( TL.lat, TL.lng ),
																				 new google.maps.LatLng( BR.lat, BR.lng ) );
	}
};
