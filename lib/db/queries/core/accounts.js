var account = function( id, name, reportdb ) {
	return { id: row.id, name: row.name, reports: reportdb };
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
	create: function( name, callback ) {
		this.db.core.query( "INSERT INTO accounts( name ) VALUES ($1) RETURNING *", [name] )
		.on( 'row', function(row){
			var reportdb = 'account_' + row.id;
			this.db.reports.db.create(reportdb, function(err, body) {
				if (err) {
					callback( null, err );
					this.db.core.query( "DELETE FROM accounts WHERE id=$1", [row.id] );
				} else {
					callback( account( row.id, row.name, this.db.reports.use(reportdb) ) );
				}
			})
		}).on('err', function(err) {
			callback( null, err );
		});
	}
};