var queries = function( db, logger ) {
	this.db = db;
	this.logger = logger;
};
queries.prototype = {
	getAll: function() {
		return this.db.core.query("SELECT * FROM sites");
	},
	byID: function( id ) {

	}
}

module.exports = queries;