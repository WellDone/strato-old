module.exports = function( db, logger ) {
	this.db = db;
	this.logger = logger;
};
module.exports.prototype = {
	getAll: function() {
		return this.db.query("SELECT * FROM sites");
	},
	byID: function( id ) {

	}
}