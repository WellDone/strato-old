define( [ 'jquery',
          'page',
          'app/explore',
          'app/manage',
          'app/profile' ],
  function ( $, page, explore, manage, profile ) {
		page( '/', explore );
		page( '/explore', explore );
		page( '/manage', manage );
		page( '/profile', profile );

		page( '*', function() {
			
		})

		page();
	}
);