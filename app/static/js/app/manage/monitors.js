define( [ 'app/manage-page', 'app/session' ], function( Renderer, session ) {
	var opts = {
		name: {
			raw: 'monitors',
			pretty_singular: 'Monitor',
			pretty_plural: 'Monitors',
			title: 'Mobile Monitors'
		},
		columns: {
			'name': 'Name',
			'location': 'Location',
			'gsmid': 'SMS Number'
		},
		prompts: {
			'name': "Monitor name...",
			'location': "(lat,long)",
			'gsmid': "+xxxxxxxxxxx"
		}
	};
	var page = new Renderer( '#manage-content', opts );

	function render() {
		page.setPermissions( session.resourcePermissions( 'monitors' ) );
		page.render();
	}
	return render;
} )