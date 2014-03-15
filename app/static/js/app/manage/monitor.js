define( [ 'jquery',
          'hbars!views/manage/monitor' ],
 function ( $, template ) {
 	return function( ctx ) {
 		$.getJSON( '/data/sites.json', function ( data ) {
 			var monitor;
 			for ( var i=0; i < data.length; ++i ) {
 				for ( var j=0; j < data[i].monitors.length; ++j ) {
 					if ( data[i].monitors[j].gsmid == ctx.params.gsmid ) {
 						monitor = data[i].monitors[j];
 						break;
 					}
 				}
 			}
 			if ( monitor ) {
 				$( '#manage-content' ).html( template( monitor ) )
 			}
 		} );
 	}
 } );