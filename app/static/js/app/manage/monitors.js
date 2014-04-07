define( [ 'app/manage-page' ], function( Renderer ) {
	var page = new Renderer( '#manage-content', {
		name: {
			raw: 'monitors',
			pretty_singular: 'Monitor',
			pretty_plural: 'Monitors',
			title: 'Mobile Monitors'
		},
		columns: {
			'name': 'Name',
			'location': 'Location',
			'gsmid': 'SMS Number',
			'status': 'Status'
		},
		create: {
			'name': "Monitor name...",
			'location': "(lat,long)",
			'gsmid': "+xxxxxxxxxxx",
			'status': 3
		}
	})
	return page.render.bind( page );
} )