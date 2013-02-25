var config = {
  databaseURL: process.env.DATABASE_URL,
  DEBUG: true,//process.env.NODE_DEBUG_MODE? true:false,
  port: process.env.PORT || 3000,
  logDir: process.env.WD_LOG_PATH || __dirname + "/debug"
};

module.exports = config;