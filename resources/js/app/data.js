/*global WD: false, google: false, $: false */

WD.data = {};
WD.data.sites = {
	load: function( callback, errorCallback ) {

		$.getJSON( "/data/sites.json", function( data ) {
			data.forEach( function(s) {
				WD.data.sites._add( s.id, s.name, s.country, s.population, s.monitors);
			});
			callback( WD.data.sites._siteData );
		});

		// Dummy data for testing purposes.
		/*WD.data.sites._add( 1234, "Charity:Water Kenya Pilot 2013", "Kenya", [
			new WD.MoMo.Monitor("Olenguruone District Hospital",
				                   new google.maps.LatLng(-0.59103333333, 35.68551667)),
			new WD.MoMo.Monitor("Mogotio Clinic",
				                   new google.maps.LatLng(-0.024783, 35.966767)),
			new WD.MoMo.Monitor("ABC Kanyuuni School",
				                   new google.maps.LatLng(1.10015, 38.07315))
		]);*/
	},
	get: function( id, callback ) {
		if ( !id ) {
			return;
		}
		callback( WD.data.sites._siteData[ id ] );
	},
	_add: function( id, name, country, population, monitors ) {
		var site = new WD.MoMo.Site(name, country, population, monitors);
		site.id = id;
		if ( ( !id && id !== 0 ) || WD.data.sites._siteData[id] ) {
			return false;
		}
	  WD.data.sites._siteData[ id ] = site;
	  return true;
	},
	_siteData: {}
};
