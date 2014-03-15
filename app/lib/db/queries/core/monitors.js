var queries = function( db, logger ) {
	this.db = db;
	this.logger = logger;
};
queries.prototype = {
	_create: function( row, options ) {
		return  { 
			id: row.id,
			name: row.name,
			loc: parsePoint( row.loc),
			gsmid: row.gsmid,
			siteid: row.siteid
		}
	},
	_extendOptions: function( options ) {
		options._create = this._create;
	},
	_fetch: function( options, callback ) {
		if ( 'object' != typeof options )
		{
			callback = options;
			options = {};
		}
		var condition = options.condition? " WHERE "+options.condition : "";
		if ( options.callback )
			callback = options.callback;
		if ( options.stream && !callback )
			return;
		if ( !options._create )
			options._create = function( row ) { return row; }

		var list;
		if ( !options.stream )
			list = [];
		this.db.core.query( "SELECT * FROM monitors " + condition )
		  .on( 'row', function(row) {
		  	if ( !options.stream )
		  		list.push( options._create( row ) );
		  })
		  .on( 'end', function() {
		  	if ( options.stream ) {
		  		if ( options.onComplete )
		  			options.onComplete();
		  	}
		  	else if ( callback )
		  	{
		  		callback( list );
		  	}
		  });
	},
	getAll: function( options, callback ) {
		this._fetch( this._extendOptions( {
			callback: callback
		} ) );
	},
	get: function( options, callback ) {
		var condition, parameters;
		if ( options.id && options.id !== 0 ) {
			condition = "ID = $1";
			parameters = [ options.id ];
		} else if ( options.name ) {
			condition = "name = $1";
			parameters = [ options.name ]
		}
		this._fetch( this._extendOptions( {
			condition: condition,
			parameters: parameters,
			callback: callback
		} ) );
	},
	delete: function( options, callback ) {
		
	}
}

module.exports = queries;