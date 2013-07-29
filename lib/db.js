var fs = require( 'fs' );

function loadQueries( coredb, reportsdb, logger ) {
  var queries = {};
  if ( true ) {
    queries.core = {};
    var coreQueries = fs.readdirSync( __dirname + '/db/queries/core' );
    coreQueries.forEach(function(file) {
      try {
        queries.core[file] = require(__dirname + '/db/queries/core/' + file)(coredb, logger);
        logger.info( "Queries loaded from core/" + file );
      } catch (e) {
        logger.error( "Failed to load queries from core/" + file );
      }
    });
  }
  if ( fs.existsSync('./db/queries/reports') ) {
    queries.reports = {};
    var reportsQueries = fs.readdirSync( __dirname + '/db/queries/reports' );
    reportsQueries.forEach(function(file) {
      try {
        queries.reports[file] = require( __dirname + '/db/queries/reports/' + file)(reportsdb, logger);
        logger.info( "Queries loaded from reports/" + file );
      } catch (e) {
        logger.error( "Failed to load queries from reports/" + file );
      }
    });
  }
  return queries;
}

module.exports = function( options, logger ) {
  if ( !options || !options.core_url || !options.reports_url )
  {
    throw new Error( "Invalid database options." );
  }

  var coredb = require('./db/coredb.js')(options.core_url, logger);
  var reportsdb = require('./db/reportsdb.js')(options.reports_url, logger);
  
  return {
    core: coredb,
    reports: reportsdb,
    queries: loadQueries( coredb, reportsdb, logger )
  };
};