module.exports = function( url, logger ) {
	logger.log( "info", "ReportsDB URL:", url );

    return require('nano')({
    	"url": url,
    	"log": function(id, args) {
    		logger.info( id, args);
    	}
    });
}