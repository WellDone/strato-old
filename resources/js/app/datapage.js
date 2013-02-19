/*global WD: false, google: false, $: false */
google.load('visualization', '1.0', {'packages': ['imageareachart']});

WD.data.drawVisualization = function () {
  var query = new google.visualization.Query(
      'https://docs.google.com/a/welldone.org/spreadsheet/tq?key=0Au25JOPkzeVadGxsOWpKQmFyWHhJZHg1NDU0RVRYQ2c&gid=5&headers=-1');

  query.setQuery('SELECT C,D');

  function handleQueryResponse(response) {
    if (response.isError()) {
      console.log('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
      return;
    }

    var data = response.getDataTable();
    WD.data._visualization = new google.visualization.ImageAreaChart( $("#graph_img").get(0) );
    WD.data._visualization.draw(data, {legend: 'bottom'});
  }

  query.send(handleQueryResponse);
};

WD.data.getData = function( site ) {
  var i;
  var data = {
    name: site.name,
    waterpoints: [],
    waterHealthRating: Math.floor( Math.random() * 100 )

  };
  for ( i=0; i<site.monitors.length; ++i ) {
    data.waterpoints.push( {
      name: site.monitors[i].name,
      status: Math.floor( Math.random() * 100 )
    });
  }
  return data;
};
