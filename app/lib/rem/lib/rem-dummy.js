var dummy = function() {

}
dummy.prototype.get = function( schema, type, filters, body, output )
{
	var out = "GET type: " + type + ", filter: " + filters
	output( out );
}
dummy.prototype.post = function( schema, type, filters, body, output )
{
	var out = "POST type: " + type + ", filter: " + filters + ", body: " + body
	output( out );
}
dummy.prototype.put = function( schema, type, filters, body, output )
{
	var out = "PUT type: " + type + ", filter: " + filters + ", body: " + body
	output( out );
}
dummy.prototype.del = function( schema, type, filters, body, output )
{
	var out = "DEL type: " + type + ", filter: " + filters
	output( out );
}


module.exports = dummy;