require.config({
	baseUrl: '/static/js/lib',
	paths: {
		app: '../app',

		jquery: 'jquery-1.11.0.min',
		d3: 'd3.v3.min',
		Handlebars: 'handlebars',
		bootstrap: 'bootstrap.min',
		MarkerClusterer: 'markerclusterer_packed',
		moment: 'moment.min',
		rickshaw: 'rickshaw.min',

		text: '../require/text',
		hbars: '../require/hbars',
		async: '../require/async',

		views: '/static/html/views'
	},
	map: {
		'*': { 'jquery': 'jquery-private' },
		'jquery-private': { 'jquery': 'jquery' }
	},
	shim: {
		Handlebars: {
			exports: 'Handlebars'
		},
		d3: {
			exports: 'd3'
		},
		MarkerClusterer: {
			exports: 'MarkerClusterer'
		}
	}
});