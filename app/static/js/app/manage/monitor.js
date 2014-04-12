define( [ 'jquery',
          'hbars!views/manage/monitor',
          'moment' ],
 function ( $, template, moment ) {
 	
 	function render( monitor ) {
		$( '#manage-content' ).html( template( monitor ) )

		$( '#clear-reports-button' ).click( function( e ) {
			e.preventDefault();
		e.stopPropagation();
		monitor.reports.forEach( function( r ) {
			$.ajax({
				url: '/api/v0/reports/' + r.id,
				type: 'DELETE'
			});
		})
		monitor.reports = [];
		render( monitor )
		} )
	}

	function init( id ) {
	 	$.getJSON( '/api/v0/monitors/' + id, function ( monitor ) { //TODO: parallelize
			$.getJSON( '/api/v0/monitors/' + id + '/reports', function( reports ) {
				reports.forEach( function( r ) {
					r.timestamp = moment( r.timestamp ).format( 'YYYY MMMM Do h:mm:ss a' );
				})
				monitor.reports = reports;
				render( monitor )
			});
		} );
	}

 	return function( ctx ) {
 		init( ctx.params.id );
 	}
 } );