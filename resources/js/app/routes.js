/*global WD: false, Router: false, $: false, alert: false*/

var showMap = function() {
  $("#data_section").hide(250);
  $("#map_section").show(250);
};
var showDataPage = function() {
  $("#map_section").hide(250);
  $("#data_section").show(250);
};

WD.routes = {
  '/overview': function() {
      showMap();
      WD.map.goToOverview();
    },
  '/country/:countryName': function( countryName ) {
      showMap();
      WD.map.goToCountry( countryName );
    },
  '/site/:siteID': function( siteID ) {
      showDataPage();
      WD.dataPage.render( siteID );
    }
};

$(document).ready( function() {
  setTimeout( function() {
    WD.map.loadMap();
    WD.data.sites.load( function() {
      WD.router = new Router(WD.routes);
      WD.router.init( "/overview" );
    } );
  }, 100 );
} );