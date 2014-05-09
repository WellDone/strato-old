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
	 			if ( !item )
	 				item = ""
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
 	Renderer.prototype.filterData = function( data, filter ) {
 		if ( !filter || filter.length == 0 )
 			return data;
 		return data.filter( function( flatObj ) {
 			for ( var index in flatObj.columns )
	 			if ( flatObj.columns[index].toString().indexOf(filter) !== -1 )
		 			return true;

		 	return false;
 		});
 	}
 	Renderer.prototype.renderData = function( data, self )
 	{
 		var dom = $(self.dom);
 		var filterText = dom.find('#filter-input').val();
		var obj = {
				name: self.name,
				columns: self.columns,
				data: self.filterData( self.flattenData( data ), filterText ),
				filter: filterText
			}
			dom.html( template( obj ) );
			dom.find('#filter-input').focus();
			if ( filterText && filterText.length > 0 )
				dom.find('#filter-input').val( filterText );

			dom.find('#deleteModal').modal( { show: false } );

			dom.find( 'tr.linkRow').click( function (e) {
			var event = e || window.event;
			page( "/manage/" + self.name.raw + "/" + $(this).attr('data-id') );
			e.stopPropagation();
		})

		dom.find('#filter-input').on( 'keyup', function() { Renderer.prototype.renderData( data, self ) } );

			if ( self.permissions.create )
			{
				dom.find( '#create-resource-button').click( function(e) {
					e = e || window.event;
				e.preventDefault();
				e.stopPropagation();
				var data = {};
				dom.find( '#create-resource-row > td > input').each( function( i ) {
					var el = $(this);
					var name = el.attr('data-name');
					var val = el.val();
					if ( val && !val.length == 0 )
					{
						data[name] = val;
					}
				})
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
				e = e || window.event;
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
				dom.find( '#actually-delete-button').off( 'click' );
				dom.find( '#actually-delete-button').on( 'click', delFunc );
				e.stopPropagation();
			});
		}
		else
		{
			dom.find( '.deleteResource' ).addClass( 'hidden' );
		}

		if ( self.permissions.edit )
		{
			dom.find( 'a.editResource' ).click( function(e) {
				e = e || window.event;
				e.stopPropagation();
				if ( !$('#edit-resource-row').hasClass( 'hidden' ) )
					return;
				var row = $(this).parent().parent();
				var id = row.attr('data-id');
				row.addClass( 'hidden' );
				row.before( $('#edit-resource-row').detach() );
				var oldData = {};
				row.find('td').each( function( i ) {
					if ( !self.columns[i] )
						return;
					oldData[self.columns[i].raw] = $( this ).text();
				})
				$('#edit-resource-row').find('td input').each( function( i ) {
					var name = $( this ).attr( 'data-name' );
					if ( oldData[ name ] )
						$( this ).val( oldData[name] );
				} );
				$('#edit-resource-row').removeClass( 'hidden' );
				$('#edit-resource-button').click( function(e) {
					var newData = {};
					$('#edit-resource-row').find('td input').each( function( i ) {
						var name = $( this ).attr( 'data-name' );
						var val = $( this ).val();
						if ( val && val.length != 0 && ( !oldData[name] || oldData[name] != val ) )
							newData[name] = val;
					});
					$.ajax({
						url: self.url + '/' + id,
						type: 'PUT',
						data: newData,
						complete: function(result) {
							$('#edit-resource-row').addClass( 'hidden' );
							row.removeClass( 'hidden' );
							$('#edit-resource-button').off( 'click' );
							self.render();
						}
					});
				})
			})
		}
		else
		{
			dom.find( '.editResource' ).addClass( 'hidden' );
		}

		if ( !self.permissions.edit && !self.permissions.del )
		{
			dom.find( '.resource-manager' ).addClass( 'hidden' );
		}
	
 	}
 	Renderer.prototype.render = function() {
 		 var self = this;
 		$.getJSON( this.url + "?order=id", function(data) {
 			Renderer.prototype.renderData( data, self );
 	 	} ); 			
 	}

 	return Renderer;
 })