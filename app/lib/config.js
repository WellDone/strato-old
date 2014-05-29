function hasFlag( flag, altFlag ) {
  if ( process.argv.indexOf( flag ) !== -1 || process.argv.indexOf( altFlag ) !== -1 ) {
    return true;
  } else {
    return false;
  }
}

function ENV( v, def ) {
  var e = process.env[v];
  return e?e:def;
}

var config = {
  hasCLFlag: hasFlag,
  getENV: ENV,
  dbConfig: {
    core_url: ENV('DATABASE_URL', 'postgres://user:password@localhost:5432/welldone'),
    reports_url: ENV('REPORTS_DATABASE_URL', 'http://localhost:5984/')
  },
  DEBUG: ( hasFlag( "--debug", "-d" ) || ENV('NODE_DEBUG_MODE') )?true:false,
  ports: {
    api: ENV('PORT', 10000),
    gateway: ENV('GATEWAYPORT', 11000)
  },
  twilioConfig: { account_sid: ENV('TWILIO_ACCOUNT_SID'),
                  auth_token:  ENV('TWILIO_AUTH_TOKEN'),
                  number:      ENV('TWILIO_NUMBER') },
  jwtSecret: ENV( 'STRATO_JWT_SECRET', "3e387369-1e29-4adf-863c-e7a33632c3c0" )
};

module.exports = config;