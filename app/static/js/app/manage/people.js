define( [ 'app/manage-page' ], function( Renderer ) {
	var page = new Renderer( '#manage-content', {
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
		create: {
			'fullname': "User's full name...",
			'phone': "Cell phone number...",
			'email': "joe@smith.net"
		}
	})
	return page.render.bind( page );
} )