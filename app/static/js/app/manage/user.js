define( [ 'jquery',
          'hbars!views/manage/user',
          'app/session' ],
 function ( $, template, session ) {
 	
 	function render( user ) {
		$( '#manage-content' ).html( template( user ) )

		$('#deleteModal').modal( { show: false } );

		if ( session.resourcePermissions('users/' + user.id + '/password').del )
		{
			$( '#reset-password-button' ).removeClass( 'hidden' );
			$( '#reset-password-button' ).click( function( e ) {
				e = e || window.event;
				e.preventDefault();
				e.stopPropagation();

				$( '#deleteModal').modal('show');
				var delFunc = function() {
					session.request({
						url: '/api/v0/users/' + user.id + '/password',
						type: 'DELETE',
						success: function( response ) {
							alert( "The new password is: " + response );
						}
					});
					$( '#delete-modal').modal('hide');
					//TODO: These shouldn't be needed, but they are.
					$('body').removeClass('modal-open');
					$('.modal-backdrop').remove();
					$( '#actually-delete-button').off( 'click', delFunc );
				}
				
				$( '#deleteModal').modal('show');
				$( '#actually-delete-button').on( 'click', delFunc );
			} );
		}
		else
		{
			$( '#reset-password-button' ).addClass( 'hidden' );
		}
	}

	function init( id ) {
	 	session.getJSON( '/api/v0/users/' + id, function ( user ) {
			render( user )
		});
	}

 	return function( ctx ) {
 		init( ctx.params.id );
 	}
 } );