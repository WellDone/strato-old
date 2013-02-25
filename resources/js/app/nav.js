/*global WD: false, $: false*/

WD.nav = {};
WD.nav.set = function( countryName, siteName ) {
  $("#country-link-container").hide();
  $("#site-link-container").hide();

  if ( countryName ) {
    $("#country-link").html(countryName);
    if ( siteName ) {
      $("#country-link").attr("href", "#/country/" + countryName);
    } else {
      $("#country-link").removeAttr("href");
    }
    $("#country-link-container").show();
  }

  if ( siteName ) {
    $("#site-link").html(siteName);//.attr("href", "#/site/" + siteData.id);
    $("#site-link-container").show();
  }

  if ( !countryName && !siteName ) {
    $("#overview-link").removeAttr("href");
  } else {
    $("#overview-link").attr("href", "#/overview");
  }
};