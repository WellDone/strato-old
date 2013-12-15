/*global WD: false, google: false, $: false, Handlebars: false, alert: false */

var TEMPLATE_REQUEST_TIMEOUT = 1000;

WD.util = {};
WD.util.templates = {};
WD.util.templates._callbacks = {};
WD.util.templates.renderTemplate = function( template, callback, errorCallback ) {
  if ( !WD.util.templates._templateList ) {
    if ( !WD.util.templates._callbacks[ template ] ) {
      WD.util.templates._callbacks[template] = [];
    }
    WD.util.templates._callbacks[template].push( { callback: callback, errorCallback: errorCallback});
    if ( !WD.util.templates._loading ) {
      WD.util.templates.loadTemplates();
    }
  } else {
    callback( WD.util.templates._templateList[template] );
  }
};
WD.util.templates.loadTemplates = function() {
  var i;
  WD.util.templates._loading = true;
  $.getJSON( 'templates.json' )
  .success( function(data) {
    WD.util.templates._templateList = {};
    $.each( data, function( key, val ) {
      WD.util.templates._templateList[key] = Handlebars.compile( val );
    });
    $.each( WD.util.templates._callbacks, function(template, callbacks) {
      if ( WD.util.templates._templateList[template] ) {
        for ( i=0; i<callbacks.length; ++i ) {
          callbacks[i].callback( WD.util.templates._templateList[template] );
        }
      } else {
        for ( i=0; i<callbacks.length; ++i ) {
          if ( callbacks[i].errorCallback ) {
            callbacks[i].errorCallback( "The template " + template + " does not exist." );
          }
        }
      }
    } );
    WD.util.templates._callbacks = null;
  })
  .error( function() {
      WD.util.templates._loading = false;
      WD.util.templates._templateList = {};
      var errorMsg = "Templates JSON failed to load: Timeout reached.";
      $.each( WD.util.templates._callbacks, function(template, callbacks) {
        for ( i=0; i<callbacks.length; ++i ) {
          if ( callbacks[i].errorCallback ) {
            callbacks[i].errorCallback( errorMsg );
          }
        }
      } );
      WD.util.templates._callbacks = null;
    });
};


