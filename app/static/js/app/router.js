define( [ 'jquery',
          'page',
          'app/explore',
          'app/manage',
          'app/profile',
          'app/dev' ],
  function ( $, page, explore, manage, profile, dev ) {
		page( '/', explore );
		page( '/explore', explore );
		page( '/manage', manage );
		page( '/profile', profile );
		page( '/dev', dev );

		page( '*', function() {
			$('#content').text("Oops!  We couldn't find what you were looking for!");
		})

		page();
	}
);