var anyDB = require( 'any-db' );
var Knex = require( 'knex' );
var schemaGenerator = require( '../rem-sql-genschema' );

var url = require( 'url' );

var createDBOptions = function( uri, poolOptions ) {
	var parsed = url.parse( uri );
	var client = parsed.protocol.substr(0,parsed.protocol.length-1)
	var options = {
		client: client,
		connection: {
			host: parsed.hostname,
			user: parsed.auth.split(':')[0],
			password: parsed.auth.split(':')[1],
			database: parsed.path.substr(1) // Skip the initial slash
		}
	}
	if ( poolOptions )
		options.pool = poolOptions;
	return options;
}
var rem_sql = function( uri, pool, logger ) {
	var options = createDBOptions( uri, pool );
	this.db = Knex( options );
	this.logger = logger;
}

rem_sql.prototype.assertValid = function()
{
	if ( !this.db )
		throw new Error( "No database has been attached to the PGSQL backend." );
}

function makeJunctionTableName( ref )
{
	if ( ref.primary )
		return ref.source.name + "_to_" + ref.target.name;
	else
		return ref.target.name + "_to_" + ref.source.name;
}

rem_sql.prototype.constructQuery = function( type, model, params, body)
{
	var query;
	var parameters = [];
	var joinCount = 0;
	if ( type == "select" )
	{
		var columns = [];
		for ( var c in params.fields )
		{
			columns.push( model.name + "." + params.fields[c] );
		}
		query = this.db.select( columns ).from( model.name );

		for ( var f in params.where )
		{
			var operator;
			var value;
			if ( typeof params.where[f] == 'object' )
			{
				operator = params.where[f].operator;
				value = params.where[f].value;
			}
			else
			{
				operator = "=";
				value = params.where[f];
			}

			if ( model.columns[f].ref && !model.columns[f].ref.manyToMany )
			{
				var target = model.columns[f].ref.target;
				query.leftJoin( target.name,
				                model.name + "." + f,
				                operator,
				                target.name + "." + target.id );
				query.whereRaw( target.name + "." + target.id + " = ?", [value] );
			}
			else if ( model.columns[f].ref && model.columns[f].ref.manyToMany )
			{
				if ( operator != "=" )
					throw new Error( "Bad operator for many-to-many condition" )
				var target = model.columns[f].ref.target;
				var junction = makeJunctionTableName( model.columns[f].ref );
				var joinID = "joinTable" + joinCount;
				query.rightOuterJoin( this.db.select( model.name + "_ref" )
					                           .from( junction )
					                           .whereRaw( target.name + "_ref = ?", [value] )
					                    .as( joinID ),
					joinID + "." + model.name + "_ref",
					model.name + "." + model.id );
				++joinCount
			}
			else
			{
				query.whereRaw( [f, operator, "?"].join(" "), [value] );
			}
			
		}

		if ( params.order )
		{
			var direction = 'ASC'
			if ( params.order.direction == 'descending' )
				direction = 'DESC'
			
			query.orderBy( params.order.column, direction )
			//order = "ORDER BY " + params.order.column + " " + direction;
		}
		return query;
	}
	else if ( type == "")
	{}
}

function applyFilter( query, params )
{
	if ( params && params.where )
	{
		for ( var f in params.where )
		{
			if ( typeof params.where[f] == 'object' )
			{
				query.whereRaw( f + params.where[f].operator + "?", [params.where[f].value] );
			}
			else
			{
				query.whereRaw( f + "=?", params.where[f] );
			}
		}
	}
	return query;
}
function transformRow( model, row ) {
	for ( var c in model.columns )
	{
		var ref = model.columns[c].ref;
		if ( row.hasOwnProperty( c ) && ref && ref.plural && row[c] == null )
		{
			row[c] = []; // Remove nulls where references didn't exist.
		}
	}
	return row;
}
rem_sql.prototype.streamQueryResults = function( query, transform, output )
{
	this.logger.info( "Executing SQL: ", query.toSQL().sql )
	var self = this;
	//this.db.query( sql, parameters )
	query.then( function( results ) {
		output( null, results );
	}).catch( function( err ) {
		self.logger.error( err );
		output( "Database query failed. " + err.toString() );
	})
}
rem_sql.prototype.get = function( model, type, params, body, output )
{
	this.assertValid();	

	var query = this.constructQuery( "select", model, params, body );

	this.streamQueryResults( query, transformRow.bind( null, model ), output );
}

rem_sql.prototype.post = function( model, type, params, body, output )
{
	this.assertValid();
	if ( params && params.length )
		throw new Error( "Conditions are not allowed when doing a POST to a resource collection." );

	var query = this.db.insert( body ).into( type );
	this.streamQueryResults( query, transformRow.bind( null, model ), output );
}

rem_sql.prototype.put = function( model, type, params, body, output )
{
	this.assertValid();

	var query = applyFilter( this.db( type ).update( body ), params );
	this.streamQueryResults( query, transformRow.bind( null, model ), output );
}

rem_sql.prototype.del = function( model, type, params, body, output )
{
	this.assertValid();

	var query = applyFilter( this.db( type ), params ).del()
	this.streamQueryResults( query, transformRow.bind( null, model ), output );
}

rem_sql.prototype.schema = function( model )
{
	var schema = schemaGenerator( model );
	return schema;
}
rem_sql.prototype.schemaString = function( model )
{
	var schema = this.schema( model );
	var schemaString = "";
	for ( var t in schema.tables ) {
		schemaString += "CREATE TABLE " + t + " (" + schema.tables[t] + "\r\n);\r\n";
	}
	for ( var i in schema.indices ) {
		schemaString += "CREATE INDEX " + i + " " + schema.indices[i] + "\r\n";
	}
	return schemaString;
}

module.exports = rem_sql;