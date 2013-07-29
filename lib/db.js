var fs = require( 'fs' );
var path = require( 'path' );

function loadQueries( db, logger ) {
  if ( fs.existsSync( __dirname + '/db/queries/reports' ) ) {
    db.queries.core = {};
    var coreQueries = fs.readdirSync( __dirname + '/db/queries/core' );
    coreQueries.forEach(function(file) {
      try {
        var name = path.basename(file,'.js');
        var queries = require(__dirname + '/db/queries/core/' + file);
        db.queries.core[name] = new queries(db, logger);
        logger.info( "Queries loaded from core/" + file );
      } catch (e) {
        logger.error( "Failed to load queries from core/" + file );
      }
    });
  }
  if ( fs.existsSync( __dirname + '/db/queries/reports' ) ) {
    db.queries.reports = {};
    var reportsQueries = fs.readdirSync( __dirname + '/db/queries/reports' );
    reportsQueries.forEach(function(file) {
      try {
        var name = path.basename(file,'.js');
        var queries = require(__dirname + '/db/queries/core/' + file);
        db.queries.reports[name] = new queries(db, logger);
        logger.info( "Queries loaded from reports/" + file );
      } catch (e) {
        logger.error( "Failed to load queries from reports/" + file );
      }
    });
  }
}

module.exports = function( options, logger ) {
  if ( !options || !options.core_url || !options.reports_url )
  {
    throw new Error( "Invalid database options." );
  }

  var coredb = require('./db/coredb.js')(options.core_url, logger);
  var reportsdb = require('./db/reportsdb.js')(options.reports_url, logger);
  
  var db = {
    core: coredb,
    reports: reportsdb,
    queries: {}
  };
  loadQueries( db, logger );
  return db;
};