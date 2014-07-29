// HELPER FUNCTIONS
var primitives = require( './primitives' );

function validateResourceName( name )
{
	return true;
}
function validateColumnType( name, types )
{
	if ( primitives[name] )
		return name;

	if ( types[name] )
		return types[name];

	throw new Error( "Invalid column type '" + name + "'" );
}
var parseRef = function( refString, plural )
{
	var ref = { plural: plural }
	var complementStart = refString.indexOf( '(' );
	if ( complementStart == -1 || refString[refString.length-1] != ')' )
		throw new Error( "Invalid reference specification '" + refString + "'" )

	ref.target = refString.substr( 0, complementStart );
	ref.complement = refString.substr( complementStart+1, refString.length-complementStart-2 );
	return ref;
}
var parseColumnType = function( typeString, types )
{
	if ( typeString.substr( 0, 4 ) == 'ref:' )
	{
		return parseRef( typeString.substr( 4 ), false );	
	}
	else if ( typeString.substr( 0, 7 ) == 'refset:' )
	{
		return parseRef( typeString.substr( 7 ), true );
	}
	else
	{
		if ( !validateColumnType( typeString, types ) )
			throw new Error( "Invalid type '" + typeString + "'." );
		return typeString;
	}
}
function parseConstraints( constraintString )
{
	var constraints = {}
	var split = constraintString.split( "," );
	for ( var i = 0; i < split.length; ++i )
	{
		var c = split[i].trim();
	  if ( c.substr( 0, 5 ) == "size:" )
	  {
	  	constraints['size'] = {};
	  	var bounds = c.substr( 5 ).split("-");
	  	if ( bounds.length == 1 )
	  	{
	  		constraints['size']['max'] = parseInt( bounds[0].trim() );
	  	}
	  	else if ( bounds.length == 2 )
	  	{
	  		constraints['size']['min'] = parseInt( bounds[0].trim() );
	  		constraints['size']['max'] = parseInt( bounds[1].trim() );
	  	} else {
	  		throw new Error( "Invalid constraint specifier '" + constraintString + "'." );
	  	}

	  	if ( isNaN( constraints['size']['max'] ) ||
	  	     ( constraints['size'].hasOwnProperty('min') && isNaN( constraints['size']['min'] ) ) )
	  		throw new Error( "Invalid constraint specifier '" + constraintString + "'.  Size bounds must be integers." );
	  }
	  else
	  {
	  	switch ( c )
	  	{
	  		case 'pkey':
	  		case 'primary_key':
	  			constraints.pkey = true;
	  			break;
	  		case 'unique':
	  			constraints.unique = true;
	  			break;
	  		case 'required':
	  		case 'notnull':
	  			constraints.required = true;
	  			break;
	  		default:
	  			throw new Error( "Invalid constraint specifier '" + constraintString + "'.  Unrecognized constraint '" + c + "'." );
	  	}
	  }
	}
	return constraints;
}
function parseColumnDescription( description, types )
{
	if ( typeof description != 'string' ) //TODO: object column descriptions
		throw new Error( "Column definitions must be specified as a string." );
	var split = description.split( '|' );
	var column = {
		type: parseColumnType( split[0].trim(), types ),
		constraints: {}
	}

	var isRefType = ( typeof column.type == 'object' );
	if ( isRefType )
	{
		column.ref = column.type;
		column.type = "ref";
	}

	if ( split.length == 2 )
	{
		column.constraints = parseConstraints( split[1] );
	}

	return column;
}

function parseTypes( input )
{
	if ( typeof input == 'string' )
		return validateColumnType( input, {} );
	else if ( typeof input != 'object' )
		throw new Error( "Invalid custom type '" + input + "'." );

	var type = {};
	for ( var sub in input )
		type[sub] = parseTypes( input[sub] );
	return type;
}

var parse = function( input ) {
	var model = {
		types: {},
		resources: {},
		top: {},
		auth: null,
		references: []
	}

	for ( var t in input.types ) {
		if ( primitives[t] )
			throw new Error( "Multiple definitions for type '" + t + "'" );
		model.types[t] = parseTypes( input.types[t] );
	}

	for ( var r in input.resources )
	{
		if ( !validateResourceName(r) )
			throw new Error( "Invalid resource name '" + r + "'." );
		var name = r;
		var ir = input.resources[r];
		var resource = {
			name: r,
			columns: {},
			id: null,
			public: true
		}

		for ( var c in ir )
		{
			if ( c.substr( 0, 1 ) == '_' )
			{
				//TODO: meta properties
				continue;
			}
			else
			{
				resource.columns[c] = parseColumnDescription( ir[c], model.types );
				if ( resource.columns[c].ref )
				{
					resource.columns[c].ref.source = resource;
					resource.columns[c].ref.column = c;
					model.references.push( resource.columns[c].ref )
				}
				if ( resource.columns[c].constraints.pkey )
				{
					if ( resource.id != null )
						throw new Error( "REM supports only single-column primary key constraints." );
					resource.id = c;
				}
			}
		}
		if ( resource.id == null )
			throw new Error( "No primary key constraint specified for resource '" + name + "'." );

		model.resources[name] = resource;
		if ( resource.public )
			model.top[name] = resource;
	}

	if ( input.auth ) {
		if ( !input.auth.resource || !input.auth.login )
			throw new Error( "Invalid auth object in data model." );
		if ( !model.resources[ input.auth.resource ] || !model.resources[ input.auth.resource ].columns[ input.auth.login ] )
			throw new Error( "Resource or login column specified for data model authentication does not exist." );
		model.auth = {
			resource: input.auth.resource,
			login: input.auth.login
		};
		model.resources[model.auth.resource].columns['_encrypted_password'] = parseColumnDescription( "string | size: 88" );
		model.resources[model.auth.resource].columns['_password_salt'] = parseColumnDescription( "string | size: 88" );
	}

	for ( var d in model.references )
	{
		var found = false;
		for ( var r in model.resources )
		{
			if ( model.references[d].target == r )
			{
				model.references[d].target = model.resources[r];
				var complement = model.resources[r].columns[ model.references[d].complement ];
				if ( !complement )
					throw new Error( "Reference complement '" + model.references[d].complement + "' not found for referenced resource '" + r + "'" );
				if ( model.references[d].plural && complement.ref.plural )
				{
					model.references[d].manyToMany = true;
					if ( !complement.ref.primary )
						model.references[d].primary = true;
				}
				found = true;
				break;
			}
		}
		if ( !found )
			throw new Error( "Reference to unknown resources '" + model.references[d].target + "'." );
	}
	return model;
}

var Modeler = {
	create: function( input ) {
		return parse( input );
	},
	simplify: function( model ) {
		console.log( model );
		var out = {};
		if ( model.columns )
		{
			for ( var c in model.columns )
			{
				if ( model.columns[c].ref )
					out[c] = "ref:" + model.columns[c].ref.target.name;	
				else
					out[c] = model.columns[c].type;
			}
		}
		else if ( model.top )
		{
			for( var r in model.top ) {
				out[r] = Modeler.simplify( model.top[r] );
			}
		}
		return out;
	}
}

module.exports = Modeler;
