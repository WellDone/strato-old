define( [ 'jquery',
					'page',
					'backbone',
					'app/session',
					'hbars!views/manage-page',
					'hbars!views/manage/management-item',
					'hbars!views/manage/management-edit' ],
	function( $, page, backbone, session, pageTemplate, itemTemplate, editTemplate ) {
		var Renderer = function( dom, args )
		{
			this.dom = dom;
			this.name = args.name;
			if ( !this.name.raw )
				throw new Error( "A name must be specified to the manage-page renderer." );
			this.columns = [];
			this.items = new backbone.Collection();
			this.items.url = '/api/v0/' + this.name.raw;
			this.permissions = {
				readonly: args.readonly,
				create: (!args.readonly && args.create),
				edit: !args.readonly,
				del: !args.readonly
			};
			for ( var c in args.columns )
			{
				var column = { raw: c, pretty: args.columns[c] };
				if ( args.create[c] )
				{
					column.create = { placeholder: args.create[c] };
				}
				this.columns.push( column );
			}
		};
		Renderer.prototype.renderData = function( self )
		{
			var dom = $(self.dom);
			var filterText = dom.find('#filter-input').val();
			var obj = {
				name: self.name,
				columns: self.columns,
				filter: filterText
			};
			dom.html( pageTemplate( obj ) );

			dom.find('#deleteModal').modal( { show: false } );

			self.itemList.render();
			dom.find('#filter-input').on( 'keyup', function() { self.itemList.render(); } );

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
					session.request({
						url: self.items.url,
						type: 'POST',
						data: data,
						complete: function(result) {
							// TODO: Display errors
							self.render();
							self.items.fetch();
						}
					});
				});
				dom.find( '#plus-button').click( function (e) {
					dom.find( '#create-resource-row').removeClass( 'hidden' );
					dom.find( '#plus-button-row').addClass( 'hidden' );
				});
			}
			else
			{
				dom.find( '#plus-button-row' ).addClass( 'hidden' );
			}
		};
		Renderer.prototype.render = function() {
			var renderer = this;
			this.items.fetch();

			var ManagementListItemView = backbone.View.extend({
				tagName: 'tr',
				className: 'linkRow',

				initialize: function() {
					this.listenTo(this.model, "change", this.render);
				},

				render: function() {
					var $el = $(this.el), self = this;
					$el.attr("data-id", self.model.attributes['id']);
					$el.click( function (e) {
						var event = e || window.event;
						page( "/manage/" + renderer.name.raw + "/" + self.model.attributes['id'] );
						e.stopPropagation();
					});
					$el.html( itemTemplate( { columns: _.omit( self.model.attributes, "id" ) } ) );

					return this;
				}
			});

			this.ManagementListView = backbone.View.extend({
				initialize: function() {
					this.collection.on('change', this.render, this);
					this.collection.on('add', this.render, this);
					this.collection.on('remove', this.render, this);
				},

				render: function() {
					var $el = $("#managementItemTable"), self = this;

					$el.empty();
					var filterText = $('#filter-input').val();
					this.collection.each(function(data) {
						var matchedFilter = _.find( _.values( _.omit( data.attributes, "id" ) ), function( value ) {
							return !filterText || filterText.length == 0 || value.toString().toLowerCase().indexOf(filterText.toLowerCase()) !== -1;
						} );
						if ( matchedFilter )
						{
							var item, sidebarItem;
							item = new ManagementListItemView({ model: data });
							$el.append(item.render().el);
						}
					});

					$el.append( editTemplate( { columns: renderer.columns } ) );

					if ( renderer.permissions.del )
					{
						$( 'a.deleteResource').click( function(e) {
							e = e || window.event;
							var id = $(this).parent().parent().attr('data-id');
							var delFunc = function() {
								session.request({
									url: renderer.items.url + '/' + id,
									type: 'DELETE',
									complete: function(result) {
										$( '#delete-modal').modal('hide');
										//TODO: These shouldn't be needed, but they are.
										$('body').removeClass('modal-open');
										$('.modal-backdrop').remove();

										renderer.render();
										renderer.items.fetch();
									}
								});
								$( '#actually-delete-button').off( 'click', delFunc );
							};
							$( '#deleteModal').modal('show');
							$( '#actually-delete-button').on( 'click', delFunc );
							e.stopPropagation();
						});
					}
					else
					{
						$( '.deleteResource' ).addClass( 'hidden' );
					}

					if ( renderer.permissions.edit )
					{
						$( 'a.editResource' ).click( function(e) {
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
								if ( !renderer.columns[i] )
									return;
								oldData[renderer.columns[i].raw] = $( this ).text();
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
								session.request({
									url: renderer.items.url + '/' + id,
									type: 'PUT',
									data: newData,
									complete: function(result) {
										$('#edit-resource-row').addClass( 'hidden' );
										row.removeClass( 'hidden' );
										$('#edit-resource-button').off( 'click' );
										renderer.render();
										renderer.items.fetch();
									}
								});
							})
						})
					}
					else
					{
						$( '.editResource' ).addClass( 'hidden' );
					}

					if ( !renderer.permissions.edit && !renderer.permissions.del )
					{
						$( '.resource-manager' ).addClass( 'hidden' );
					}

					return this;
				}
			});
			this.itemList = new this.ManagementListView({ collection: this.items });
			this.itemList.collection.comparator = "id";
			Renderer.prototype.renderData( this );
		};

		return Renderer;
	});
