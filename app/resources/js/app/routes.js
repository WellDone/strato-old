/*global WD: false, Router: false, $: false, alert: false*/

var showMap = function() {
  $('#data_section').css('zIndex', 99);
  $('#map_section').css('zIndex', 0);
  $("#data_section").hide(150);
  $("#map_section").show();
  $("header").removeClass( "solid" );
};
var showDataPage = function() {
  $('#map_section').css('zIndex', 99);
  $('#data_section').css('zIndex', 0);
  $("#map_section").hide(150);
  $("#data_section").show();
  $("header").addClass( "solid" );
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
  WD.router = new Router(WD.routes);
  WD.router.init();
  loadMap();
  WD.data.sites.load( function() {
    WD.router.setRoute( "/overview" );
  } );
} );