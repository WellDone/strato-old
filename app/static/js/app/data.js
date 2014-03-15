function dataResource( name, options ) {
	this.name = name;
	this.options = options;

	this.data = null;
	this.timestamp = null;
}
dataResource.prototype = {
}

function validResourceName( resource ) {
	return ( resource.match( /[\/\\]/ ).length == 0 );
}
function parseSelector( selectorText ) {
	return { name: 'id', value: selectorText };
}
function parseResource( fullResource ) {
	var components = fullResource.split(/[\/\\]/);
	var path = [];
	var currentResource = null;
	for ( var i=0; i<components.length; ++i ) {
		if ( currentResource == null )
			currentResource = components[i];
		else
			path.push( { 
				resource: currentResource,
				selector: parseSelector( components[i] )
			} );
	}
	if ( currentResource != null )
		path.push( { resource: currentResource } );
}

function dataEngine( baseURL, model ) {
	if ( baseURL[baseURL.length-1] == '/' )
		baseURL = baseURL.substring( 0, baseURL.length-1 );

	this.baseURL = baseURL;
	this.resources = {};

	if ( !model )
		model = baseURL + "/model.js";

	this.loadModel( model );
}
dataEngine.prototype = {
	loadModel: function( model ) {
		if ( typeof model == 'Object' )
		{
			this.model = model;
		}
		else if ( typeof model == 'String' )
		{
			//TODO
		}
	}

	addResource: function( name, options ) {
		if ( !validResourceName( name ) )
			throw "bad resource name";

		var resource = new dataResource( name, options );
	}
	configureResource: function( name, options ) {
		if ( !this.resources[name] )
			return;
	}
	refreshResource: function( name ) {
		if ( !this.resources[name] )
			return;
	}
	watch: function( resource, callback, options ) {

	}

	get: function( resource, options ) {
		var path = parseResource( resource, options );
	}
}


define( [], function() {
	var dataEngineCache = {};
	return function( baseURL ) {
		if ( !dataEngineCache[baseURL] )
			dataEngineCache[baseURL] = new dataEngine( baseURL );

		return dataEngineCache[baseURL];
	}
})