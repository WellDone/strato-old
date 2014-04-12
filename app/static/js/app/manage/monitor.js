define( [ 'jquery',
          'hbars!views/manage/monitor',
          'd3',
          'd3-timeline' ],
 function ( $, template, d3 ) {
 	return function( ctx ) {
 		$.getJSON( '/api/v0/monitors/' + ctx.params.id, function ( monitor ) { //TODO: parallelize
 			$.getJSON( '/api/v0/monitors/' + monitor.id + '/reports', function( reports ) {
 				monitor.reports = reports;
 				$( '#manage-content' ).html( template( monitor ) )
 			})
 		} );
 	}
 } );