define( [ 'jquery',
          'hbars!views/manage/monitor' ],
 function ( $, template ) {
 	return function( ctx ) {
 		$.getJSON( '/api/v0/monitors/' + ctx.params.id, function ( monitor ) {
 			$( '#manage-content' ).html( template( monitor ) )
 		} );
 	}
 } );