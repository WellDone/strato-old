define( [ 'app/manage-page' ], function( Renderer ) {
	var page = new Renderer( '#manage-content', {
		name: {
			raw: 'groups',
			pretty_singular: 'Group',
			pretty_plural: 'Groups',
			title: 'Mobile Monitor Groups'
		},
		columns: {
			'name': 'Name',
			'monitors': 'Monitors'
		},
		create: {
			'name': "Group name..."
		}
	})
	return page.render.bind( page );
} )