define( [ 'jquery' ], function( $ ) {
	function onSearchSubmit( e ) {
		e.preventDefault();
	}
	var searchForm = $('#navbar-search-form');
	searchForm.submit( onSearchSubmit );

	return {
		hideSearch: function() {
			searchForm.addClass('hidden');
		},
		showSearch: function() {
			//searchForm.removeClass('hidden');
		}
	}
})