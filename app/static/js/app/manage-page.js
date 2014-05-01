define( [ 'jquery',
	'page',
	'backbone',
	'hbars!views/manage-page',
	'hbars!views/manage/management-item' ],
	function( $, page, backbone, pageTemplate, itemTemplate ) {
		var Renderer = function( dom, args )
		{
			this.dom = dom;
			this.name = args.name;
			if ( !this.name.raw )
				throw new Error( "A name must be specified to the manage-page renderer." );
			this.columns = [];
			this.items = new Backbone.Collection();
			this.items.url = '/api/v0/' + this.name.raw;
			this.items.fetch();
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
			var ManagementListItemView = Backbone.View.extend({
				tagName: 'tr',
				className: 'linkRow',

				render: function() {
					var $el = $(this.el), self = this;
					$el.attr("data-id", self.model.attributes['id']);
					$el.click( function (e) {
						var event = e || window.event;
						page( "/manage/" + args.name.raw + "/" + self.model.attributes['id'] );
						e.stopPropagation();
					});
					$el.html( itemTemplate( { columns: _.omit( this.model.attributes, "id" ) } ) );

					return this;
				},
			});
			renderer = this;
			this.ManagementListView = Backbone.View.extend({
				initialize: function() {
					this.collection.on('add', this.render, this);
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

					if ( renderer.permissions.del )
					{
						$( 'a.deleteResource').click( function(e) {
							e = e || window.event;
							var id = $(this).parent().parent().attr('data-id');
							var delFunc = function() {
								$.ajax({
									url: renderer.items.url + '/' + id,
									type: 'DELETE',
									complete: function(result) {
										$( '#delete-modal').modal('hide');
										//TODO: These shouldn't be needed, but they are.
										$('body').removeClass('modal-open');
										$('.modal-backdrop').remove();

										renderer.render();
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

					if ( !renderer.permissions.edit )
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
					});
					if ( done )
						return;
					$.ajax({
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
			var self = this;
			Renderer.prototype.renderData( self );
		};

		return Renderer;
	});