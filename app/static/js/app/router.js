define( [ 'jquery',
          'page',
          'app/explore',
          'app/manage' ],
  function ( $, page, explore, manage ) {
		page( '/', explore );
		page( '/explore', explore );
		page( '/manage', manage );

		page( '*', function() {
			
		})

		page();
	}
);