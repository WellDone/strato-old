/*global WD: false, Router: false, $: false, alert: false*/

var showMap = function() {
  $("#data_section").hide();
  $("#map_section").show();
};
var showDataPage = function() {
  $("#map_section").hide();
  $("#data_section").show();
};
var mapLoaded = false;
var loadMap = function() {
  if (!mapLoaded) {
    WD.map.loadMap();
    mapLoaded = true;
  };
}

WD.routes = {
  '/overview': function() {
      showMap();
      setTimeout( function() {
        loadMap();
        WD.map.goToOverview();
      }, 250);
    },
  '/country/:countryName': function( countryName ) {
      showMap();
      setTimeout( function() {
        loadMap();
        WD.map.goToCountry( countryName );
      }, 250);
    },
  '/site/:siteID': function( siteID ) {
      showDataPage();
      WD.dataPage.render( siteID );
    }
};

$(document).ready( function() {
  WD.data.sites.load( function() {
    WD.router = new Router(WD.routes);
    WD.router.init( "/overview" );
  } );
} );