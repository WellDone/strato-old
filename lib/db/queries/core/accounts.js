var account = function( id, name, reportdb ) {
	return { id: row.id, name: row.name, reports: reportdb };
}

function getDate(timestamp) {
	timestamp = new Date(timestamp);
	return new Date( timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate() );
}
var default_design_doc = {
	_id: "_design/default",
	views: {
		byMonitor: {
			map: function(doc) {
				emit( [doc.monitor, getDate(doc.timestamp).toJSON()], null);
			}
		}
	}
}

module.exports = function( db, logger ) {
	this.db = db;
	this.logger = logger;
};
module.exports.prototype = {
	getAll: function( callback ) {
		this.db.core.query( "SELECT * FROM accounts" )
		.on( 'row', function(row) {
			callback( account( row.id, row.name, this.db.reports.use(reportdb) ) );
		}).on( 'err', function(err) {
			callback( null, err );
		})
	},
	byID: function( id ) {
		this.db.core.query( "SELECT * FROM accounts WHERE id=$1", [id] )
		.on( 'row', function(row) {
			callback( account( row.id, row.name, this.db.reports.use(reportdb) ) );
		}).on( 'err', function(err) {
			callback( null, err );
		})
	},
	byName: function( name, callback ) {
		this.db.core.query( "SELECT * FROM accounts WHERE name=$1", [name] )
		.on( 'row', function(row) {
			callback( account( row.id, row.name, this.db.reports.use(reportdb) ) );
		}).on( 'err', function(err) {
			callback( null, err );
		})
	},
	createReportsDB: function( dbname, callback ) {
		this.db.reports.db.create(dbname, function(err, body) {
			if (err) {
				callback(null,err);
			} else {
				this.db.reports.use(dbname).insert(default_design_doc, '_design/default', function(err, body) {
					if (err) {
						callback(null,err);
						this.db.reports.db.destroy(dbname);
					} else {
						callback(this.db.reports.use(dbname));
					}
				})
			}
		});
	},
	create: function( name, callback ) {
		this.db.core.query( "INSERT INTO accounts( name ) VALUES ($1) RETURNING *", [name] )
		.on( 'row', function(row){
			var reportdb = 'account_' + row.id;
			this.createReportsDB( reportdb, function(obj, err) {
				if (err) {
					callback( null, err );
					this.db.core.query( "DELETE FROM accounts WHERE id=$1", [row.id] );
				} else {
					callback( account( row.id, row.name, obj ) );
				}
			});
		}).on('err', function(err) {
			callback( null, err );
		});
	}
};