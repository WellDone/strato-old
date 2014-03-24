define( [ 'jquery',
          'hbars!views/manage/monitor',
          'd3',
          'd3-timeline' ],
 function ( $, template, d3 ) {
 	return function( ctx ) {
 		$.getJSON( '/api/v0/monitors/' + ctx.params.id, function ( monitor ) {
 			$( '#manage-content' ).html( template( monitor ) )
 		} );
 	}
 } );