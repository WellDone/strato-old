/*global WD: false, google: false, $: false, Handlebars: false, alert: false */
WD.templates = {};
WD.templates.renderDataPage = function( data )
{
	WD.templates.renderTemplate( "datapage", function(template) {
  	$("#data_section").html( template( data ) );
  	setTimeout( WD.data.drawVisualization, 100 );
  }, function(err){alert(err);});
};

WD.templates.renderTemplate = function( template, callback, errorCallback ) {
  if ( !WD.templates._templateList ) {
    if ( !WD.templates._loading ) {
      WD.templates._loading = true;
      WD.templates._failureTimeout = setTimeout( function() {
        WD.templates._loading = false;
        WD.templates._templateList = {};
        var errorMsg = "Templates JSON failed to load: Timeout reached.";
        if ( errorCallback ) { errorCallback( errorMsg ); }
      }, 1000 );
      $.getJSON( 'templates.json', function(data) {
        WD.templates._templateList = {};
        $.each( data, function( key, val ) {
          WD.templates._templateList[key] = Handlebars.compile( val );
        });
        if ( WD.templates._templateList[template] ) {
          callback( WD.templates._templateList[template] );
        } else {
          if (errorCallback) { errorCallback( "Template does not exist" ); }
        }
        clearTimeout( WD.templates._failureTimeout );
      });
    }
  } else {
    callback( WD.templates._templateList[template] );
  }
};


