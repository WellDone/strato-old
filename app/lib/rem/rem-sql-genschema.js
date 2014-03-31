var Modeler = require( './lib/modeler' );

var manyToManyReferences = [];
function translateType( column )
{
	if ( column.type == 'string' )
	{
		if ( column.constraints.size && column.constraints.size.max )
			return "varchar(" + column.constraints.size.max + ")";
		else
			return "text";
	}
	else if ( column.type == 'int' )
	{
		return "integer";
	}
	else if ( column.type == 'id' )
	{
		return "SERIAL"
	}
	else if ( column.type == 'point' )
	{
		return "point";
	}
	else if ( column.type == 'ref' )
	{
		if ( column.ref.manyToMany )
		{
			if ( manyToManyReferences.indexOf( column.ref.target.columns[ column.ref.complement ].ref ) == -1 )
				manyToManyReferences.push( column.ref );
			return null;
		}
		else if ( !column.ref.plural )
		{
			var targetColumn = column.ref.target.columns[ column.ref.target.id ];
			return translateType( targetColumn );
		}
		else
		{
			return null;
		}
	}
	throw new Error( "Unable to translate column type '" + column.type + "'." );
}

function describeColumn( name, column )
{
	var description = [name];

	var type = translateType( column )
	if ( !type )
		return null;
	description.push( type );
	
	if ( column.constraints.unique )
		description.push( "UNIQUE" );
	if ( column.constraints.required )
		description.push( "NOT NULL" );
	if ( column.constraints.pkey )
		description.push( "PRIMARY KEY" );

	return description.join( ' ' );
}

function createReferenceTables( manyToManyReferences )
{
	var tables = {};
	for ( var r in manyToManyReferences )
	{
		var name = manyToManyReferences[r].source.name + "_to_" + manyToManyReferences[r].target.name;
		tables[name] = [];
		tables[name].push( describeColumn( manyToManyReferences[r].source.name + "_ref", {
			type: "ref",
			ref: {
				plural: false,
				target: manyToManyReferences[r].source
			},
			constraints: { required: true }
		} ) );
		tables[name].push( describeColumn( manyToManyReferences[r].target.name + "_ref", {
			type: "ref",
			ref: {
				plural: false,
				target: manyToManyReferences[r].target
			},
			constraints: { required: true }
		} ) );
		tables[name] = "\r\n\t" + tables[name].join("\r\n\t");
	}
	return tables;
}

function generateSchema( model )
{
	var tables = {};
	for ( var r in model.resources )
	{
		var columns = [];
		for ( var c in model.resources[r].columns )
		{
			var column = describeColumn( c, model.resources[r].columns[c] );
			if ( column )
				columns.push( column )
		}
		tables[r] = "\r\n\t" + columns.join( "\r\n\t" );
	}
	var schema = "";
	for ( var t in tables )
	{
		schema += "CREATE TABLE " + t + " (" + tables[t] + "\r\n)\r\n";
	}
	var referenceTables = createReferenceTables( manyToManyReferences );
	for ( var t in referenceTables )
	{
		tables[t] = referenceTables[t]
		schema += "CREATE TABLE " + t + " (" + referenceTables[t] + "\r\n)\r\n";
	}
	return tables;
	return schema;
}

module.exports = generateSchema;

var model = {
	"types": {
		"point": {
			"latitude": "float",
			"longitude": "float"
		}
	},
	"resources": {
		"monitors": {
			"id"       : "int            | pkey",
			"name"     : "string         | unique",
			"location" : "point",
			"gsmid"    : "string         | unique, required, size: 20",
			"groups"   : "refset:groups(monitors)"
		},
		"groups": {
			"id"       : "int            | pkey",
			"name"     : "string         | unique, required",
			"owner"    : "ref:accounts(groups)   | required",
			"monitors" : "refset:monitors(groups)",
			"alerts"   : "refset:alerts(group)"
		},
		"accounts": {
			"name"     : "string         | pkey, required",
			"groups"   : "refset:groups(owner)",
			"users"    : "refset:users(accounts)"
		},
		"users": {
			"id"       : "int            | pkey",
			"fullname" : "string         | required",
			"phone"    : "string         | unique",
			"email"    : "string         | unique",
			"accounts" : "refset:accounts(users) | required",
			"alerts"   : "refset:alerts(user)"
		},
		"alerts": {
			"id"      : "int | pkey",
			"group"   : "ref:groups(alerts) ",
			"user"    : "refset:users(alerts)"
		}
	}
}
console.log( generateSchema( Modeler.create( model ) ) );