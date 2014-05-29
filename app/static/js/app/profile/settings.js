define( [ 'jquery',
					'page',
          'hbars!views/profile/settings',
          'app/session' ],
 function( $, page, template, session ) {
 	var render = function() {
	 	$('#content').html( template() );
	 	var form = $('#change-password-form');
	 	form.submit( function( e ) {
	 		e.preventDefault();
	 		var old_password = form.find("input[name=old_password]").val();
			var new_password = form.find("input[name=new_password]").val();
			var confirm_new_password = form.find("input[name=confirm_new_password]").val();

			if ( new_password == confirm_new_password ) {
				session.request( {
					url: '/api/v0/users/' + session.getUser().user.id + "/password",
					type: 'POST',
					data: {
						old_password: old_password,
						new_password: new_password
					},
					success: function() {
						page( '/manage' );
					}
				} );
			}
	 	})
	}
	return render;
 })