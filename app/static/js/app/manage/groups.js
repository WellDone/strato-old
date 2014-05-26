define( [ 'app/manage-page', 'app/session' ], function( Renderer, session ) {
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
		prompts: {
			'name': "Group name..."
		}
	})
	function render() {
		page.setPermissions( session.resourcePermissions( 'groups' ) );
		page.render();
	}
	return render;
} )