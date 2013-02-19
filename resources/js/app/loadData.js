/*global WD: false, google: false */

WD.data = {};
WD.data.sites = {};

WD.data.AddMoMoSite = function(name, country, monitors) {
  if (WD.data.sites[name]) {
    return;
  }
  WD.data.sites[name] = new WD.MoMo.Site(name, country, monitors);
};

// Dummy data for testing purposes.
// TODO: Load this data from the server.
WD.data.AddMoMoSite("Some Kenyan Village", "Kenya", [
			new WD.MoMo.Monitor("Olenguruone District Hospital",
				                   new google.maps.LatLng(-0.59103333333, 35.68551667)),
			new WD.MoMo.Monitor("Mogotio Clinic",
				                   new google.maps.LatLng(-0.024783, 35.966767)),
			new WD.MoMo.Monitor("ABC Kanyuuni School",
				                   new google.maps.LatLng(1.10015, 38.07315))
		]);
WD.data.AddMoMoSite( "Charity:Water Pilot 2013", "Ethiopia", [

		]);
WD.data.AddMoMoSite( "Nepal Pilot 2013", "Nepal", [

		]);
