define( [ 'jquery',
          'hbars!views/manage/monitor',
          'moment' ],
 function ( $, template, moment ) {
 	
 	function render( monitor ) {
		$( '#manage-content' ).html( template( monitor ) )

		$('#deleteModal').modal( { show: false } );

		$( '#clear-reports-button' ).click( function( e ) {
			e = e || window.event;
			e.preventDefault();
			e.stopPropagation();

			$( '#deleteModal').modal('show');
			var delFunc = function() {
				monitor.reports.forEach( function( r ) {
					$.ajax({
						url: '/api/v0/reports/' + r.id,
						type: 'DELETE'
					});
				})
				monitor.reports = [];
				render( monitor )
				$( '#delete-modal').modal('hide');
				//TODO: These shouldn't be needed, but they are.
				$('body').removeClass('modal-open');
				$('.modal-backdrop').remove();
				$( '#actually-delete-button').off( 'click', delFunc );
			}
			
			$( '#deleteModal').modal('show');
			$( '#actually-delete-button').on( 'click', delFunc );
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