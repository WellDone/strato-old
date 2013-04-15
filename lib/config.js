function hasFlag( flag, altFlag ) {
  if ( process.argv.indexOf( flag ) !== -1 || process.argv.indexOf( altFlag ) !== -1 ) {
    return true;
  } else {
    return false;
  }
}

function ENV( v ) {
  var e = process.env[v];
  return (e==0)?false:e;
}

var config = {
  hasCLFlag: hasFlag,
  getENV: ENV,
  databaseURL: ENV('DATABASE_URL'),
  DEBUG: ( hasFlag( "--debug", "-d" ) || ENV('NODE_DEBUG_MODE') )?true:false,
  port: ENV('PORT') || 3000,
  logDir: ENV('WD_LOG_PATH') || "./log",
  twilioConfig: { account_sid: ENV('TWILIO_ACCOUNT_SID'),
                  auth_token:  ENV('TWILIO_AUTH_TOKEN'),
                  number:      ENV('TWILIO_NUMBER') }
};

module.exports = config;