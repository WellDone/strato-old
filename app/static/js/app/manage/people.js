define( [ 'app/manage-page', 'app/session' ], function( Renderer, session ) {
	var opts = {
		name: {
			raw: 'users',
			pretty_singular: 'Person',
			pretty_plural: 'People',
			title: 'Strato Users'
		},
		columns: {
			'fullname': 'Full Name',
			'phone': 'Phone Number',
			'email': 'Email'
		},
		prompts: {
			'fullname': "User's full name...",
			'phone': "Cell phone number...",
			'email': "joe@smith.net"
		}
	}

	var page = new Renderer( '#manage-content', opts );
	function render() {
		page.setPermissions( session.resourcePermissions('users') );
		page.render();
	}
	return render;
} )