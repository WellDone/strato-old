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
      if ( WD.data.sites[siteID] )
      {
        showDataPage();
        WD.templates.renderDataPage( WD.data.sites[siteID] );
      } else {
        alert( "Site not found!" );
      }
    }
};

$(document).ready( function() {
  WD.map.loadMap();
  WD.router = new Router(WD.routes);
  WD.router.init( "/overview" );
} );