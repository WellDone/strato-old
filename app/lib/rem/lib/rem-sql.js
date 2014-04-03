var anyDB = require( 'any-db' );
var schemaGenerator = require( '../rem-sql-genschema' );

var rem_sql = function( url, poolOptions, logger ) {
	this.db = ( poolOptions ) ? anyDB.createPool( url, poolOptions ) : anyDB.createConnection( url );
	this.db.on( 'error', function(err) {
		throw err;
	})
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

function constructQuery( type, model, filters, body)
{
	var query;
	var parameters = [];
	if ( type == "select" )
	{
		var columns = [];
		var tables = [];
		var joins = [];
		var conditions = [];
		var groupBy = ""

		tables.push( model.name );

		for ( var c in model.columns )
		{
			if ( model.columns[c].ref ) {
				if ( model.columns[c].ref.manyToMany )
				{
					var refTable = makeJunctionTableName( model.columns[c].ref );
					var joinID = "join_table" + joins.length;
					joins.push( "LEFT JOIN ( SELECT " + model.name + "_ref," + 
						      "\r\n                   array_agg(" + model.columns[c].ref.target.name + "_ref) AS " + model.columns[c].ref.target.name + 
						      "\r\n            FROM " + refTable + " GROUP BY " + model.name + "_ref" + " )" + 
					        "\r\n       AS " + joinID + 
					        "\r\n       ON " + model.name + "." + model.id + "=" + joinID + "." + model.name + "_ref"
					          );
					columns.push( joinID + "." + model.columns[c].ref.target.name  );
					groupBy = model.name + "." + model.id;
				}
				else if ( model.columns[c].ref.plural ) // one-to-many
				{
					var refTable = model.columns[c].ref.target.name;
					var joinID = "join_table" + joins.length;
					joins.push( "LEFT JOIN ( SELECT " + model.columns[c].ref.complement + ", " + 
						      "\r\n                   array_agg(" + model.columns[c].ref.target.id + ") AS " + model.columns[c].ref.target.name + 
						      "\r\n            FROM " + refTable + " GROUP BY " + model.columns[c].ref.complement + " )" + 
					        "\r\n       AS " + joinID + 
					        "\r\n       ON " + model.name + "." + model.id + "=" + joinID + "." + model.columns[c].ref.complement
					          );
					columns.push( joinID + "." + model.columns[c].ref.target.name );
				}
			}
			else
			{
				columns.push( model.name + "." + c );
			}
		}
		for ( var f in filters )
		{
			var operator;
			var value;
			if ( typeof filters[f] == 'object' )
			{
				operator = filters[f].operator;
				value = filters[f].value;
			}
			else
			{
				if ( model.columns[f].ref && model.columns[f].ref.plural )
				{
					operator = "@>";
					value = [];
					value.push( filters[f] )
				}
				else
				{
					operator = "=";
					value = filters[f];
				}

			}
			conditions.push( [f, operator, "$" + parameters.length+1].join(" ") );
			parameters.push( value );
		}
		query = "SELECT " + columns.join( ", \r\n\t" )
		     + "\r\nFROM " + tables.join( ", " ) 
		     + ( joins.length? "\r\n" + joins.join("\r\n") : "" )
		     + ( conditions.length?"\r\nWHERE " + conditions.join( "\r\n AND " ) : "" )
		     + ";"
	}
	else if ( type == "")
	{}

	return {
		sql: query,
		parameters: parameters
	}
}

function parseFilter( model, filters )
{
	var columns = Object.keys( model.columns );

	var conditions = [];
	var parameters = [];
	if ( filters )
	{
		for ( var f in filters )
		{
			if ( typeof filters[f] == 'object' )
			{
				conditions.push( f + filters[f].operator + "$" + (parameters.length+1) );
				parameters.push( filters[f].value );
			}
			else
			{
				conditions.push( f + "=$" + (parameters.length+1) );
				parameters.push( filters[f] );
			}
		}
	}
	var condition = (conditions.length > 0)? " WHERE " + conditions.join(' AND ') : ""
	return {
		columns: columns,
		condition: condition,
		parameters: parameters
	}
}
function parseBody( body )
{
	var columns = [];
	var parameters = [];
	var valueArgs = [];
	for ( var i in body )
	{
		columns.push( i );
		parameters.push( body[i] );
		valueArgs.push( "$" + parameters.length );
	}

	return {
		columns: columns,
		parameters: parameters,
		valueArgs: valueArgs
	}
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
rem_sql.prototype.streamQueryResults = function( sql, parameters, transform, output )
{
	this.logger.info( "Running SQL query:\r\n", sql, "\r\nparameters: [ " + parameters.toString() + " ]" );
	
	var result = [];
	var self = this;
	this.db.query( sql, parameters )
	.on( 'data', function( row ) {
		result.push( transform( row ) );
	} )
	.on( 'end', function() {
		output( null, result );
	} )
	.on( 'error', function( err ) {
		self.logger.error( err );
		output( "Database query failed. " + err.toString() );
	})
}
rem_sql.prototype.get = function( model, type, filters, body, output )
{
	this.assertValid();	

	var query = constructQuery( "select", model, filters, body );

	this.streamQueryResults( query.sql, query.parameters, transformRow.bind( null, model ), output );
}

rem_sql.prototype.post = function( model, type, filters, body, output )
{
	this.assertValid();
	if ( filters && filters.length )
		throw new Error( "Conditions are not allowed when doing a POST to a resource collection." );
	var parsedBody = parseBody( body );

	var sql = "INSERT INTO " + type + " (" + parsedBody.columns.join(", ") + ") VALUES (" + parsedBody.valueArgs.join(", ") + ")";
	this.streamQueryResults( sql, parsedBody.parameters, transformRow.bind( null, model ), output );
}

rem_sql.prototype.put = function( model, type, filters, body, output )
{
	this.assertValid();
	var parsedFilter = parseFilter( model, filters );
	var parsedBody = parseBody( type, body );
	var parameters = parsedFilter.parameters.concat( parsedBody.parameters );

	var assignmentStrings = [];
	for ( var i = 0; i < parsedBody.columns.length; ++i )
	{
		var j = (i+parsedFilter.parameters.length+1);
		assignmentStrings.push( parsedBody.columns[i] + "=$"+ j );
	}

	var sql = "UPDATE " + type + " SET " + assignmentStrings.join( ", " ) + parsedFilter.condition;
	this.streamQueryResults( sql, parameters, transformRow.bind( null, model ), output );
}

rem_sql.prototype.del = function( model, type, filters, body, output )
{
	this.assertValid();
	var parsedFilter = parseFilter( model, filters );

	var sql = "DELETE FROM " + type + parsedFilter.condition;
	this.streamQueryResults( sql, parsedFilter.parameters, transformRow.bind( null, model ), output );
}

rem_sql.prototype.schema = function( model )
{
	var schema = schemaGenerator( model );
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