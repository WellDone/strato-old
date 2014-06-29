var data = require( '../lib/data' )();
var Auth = require( '../lib/rem/lib/authentication' )

Auth.encryptPassword( "password", {}, function( err, pwd, salt ) {
  if ( err || !pwd || !salt )
  {
    console.log( "ERROR: " + err );
    return;
  }
  data.post( 'users', {withSensitive: true}, { fullname: "Admin", "email": "admin", "_encrypted_password": pwd, "_password_salt": salt }, function( err ) {
    if ( err ) {
      console.log( "Seeding admin user failed!", err );
    }
    process.exit();
  } );
} );