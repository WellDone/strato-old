var Authenticator = require( './lib/REM/lib/authentication' )

var auth = new Authenticator( {
	findUser: true,
	getEncryptedPassword: true,
	getPasswordSalt: true,
	getAllRoles: true
} )
auth.encryptPassword( "password", { salt: "abcdefg"}, function( err, key ) {
	console.log( key );
})