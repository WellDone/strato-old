/*global WD: false, google: false, $: false, Handlebars: false */
WD.templates = {};

WD.templates.templateList = {};
$.getJSON( 'templates.json', function(data) {
  WD.templates.templateList = data;
});
WD.templates.renderDataPage = function( data )
{
	var source   = WD.templates.templateList.datapage;
  if ( source ) {
  	var template = Handlebars.compile(source);
  	$("#data_section").html( template( data ) );
  	WD.data.drawVisualization();
  }
};
