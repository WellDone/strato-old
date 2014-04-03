define( [ 'jquery',
	        'page',
          'hbars!views/manage-page' ],
 function( $, page, template ) {
 	var Renderer = function( dom, args )
 	{
 		this.dom = dom;
 		this.name = args.name;
 		if ( !this.name.raw )
 			throw new Error( "A name must be specified to the manage-page renderer." )
 		this.url = '/api/v0/' + this.name.raw
 		this.columns = [];
 		this.permissions = {
 			readonly: args.readonly,
 			create: (!args.readonly && args.create),
 			edit: !args.readonly,
 			del: !args.readonly
 		}
 		for ( var c in args.columns )
 		{
 			var column = { raw: c, pretty: args.columns[c] }
 			if ( args.create[c] )
 			{
 				column.create = { placeholder: args.create[c] }
 			}
 			this.columns.push( column );
 		}
 	};
 	Renderer.prototype.flattenData = function( data ) {
 		var out = [];
 		for ( var d in data )
 		{
 			var flatObj = { id: data[d].id, columns: [] };
	 		for ( var i = 0; i < this.columns.length; ++i )
	 		{
	 			var item = data[d][this.columns[i].raw];
	 			if ( $.isArray( item ) )
	 			{
	 				item = {
	 					isRef: true,
	 					refs: item
	 				}
	 			}
	 			flatObj.columns.push( item );
	 		}
	 		out.push( flatObj );
 		}
 		return out;
 	}
 	Renderer.prototype.render = function() {
 		var self = this;
 		var dom = $(self.dom);
 		$.getJSON( this.url, function(data) {
 			var obj = {
 				name: self.name,
 				columns: self.columns,
 				data: self.flattenData( data )
 			}
 			dom.html( template( obj ) );
 			dom.find('#deleteModal').modal( { show: false } );

 			dom.find( 'tr.linkRow').click( function (e) {
				var event = e || window.event;
				page( "/manage/" + self.name.raw + "/" + $(this).attr('data-id') );
				e.stopPropagation();
			})

 			if ( self.permissions.create )
 			{
 				dom.find( '#create-resource-button').click( function(e) {
					e.preventDefault();
					e.stopPropagation();
					var data = {};
					var done = false;
					dom.find( '#create-resource-row > td > input').each( function( i ) {
						var el = $(this);
						var name = el.attr('data-name');
						var val = el.val();
						if ( !val && !done )
						{
							done = true;
							alert( "Invalid value specified for " + name + "." );
						}
						data[name] = val;
					})
					if ( done )
						return;
					$.ajax({
						url: self.url,
						type: 'POST',
						data: data,
						complete: function(result) {
							// TODO: Display errors
							self.render();
						}
					});
				})
				dom.find( '#plus-button').click( function (e) {
					dom.find( '#create-resource-row').removeClass( 'hidden' );
					dom.find( '#plus-button-row').addClass( 'hidden' );
				})
			}
			else
			{
				dom.find( '#plus-button-row' ).addClass( 'hidden' );
			}

			if ( self.permissions.del )
			{
				dom.find( 'a.deleteResource').click( function(e) {
					var event = e || window.event;
					var id = $(this).parent().parent().attr('data-id');
					var delFunc = function() {
						$.ajax({
							url: self.url + '/' + id,
							type: 'DELETE',
							complete: function(result) {
								dom.find( '#delete-modal').modal('hide');
								//TODO: These shouldn't be needed, but they are.
								$('body').removeClass('modal-open');
								$('.modal-backdrop').remove();

								self.render();
							}
						});
						dom.find( '#actually-delete-button').off( 'click', delFunc );
					}
					dom.find( '#deleteModal').modal('show');
					dom.find( '#actually-delete-button').on( 'click', delFunc );
					e.stopPropagation();
				});
			}
			else
			{
				dom.find( '.deleteResource' ).addClass( 'hidden' );
			}

			if ( !self.permissions.edit )
			{
				dom.find( '.editResource' ).addClass( 'hidden' );
			}

			if ( !self.permissions.edit && !self.permissions.del )
			{
				dom.find( '.resource-manager' ).addClass( 'hidden' );
			}
	 	} );
 	}

 	return Renderer;
 })