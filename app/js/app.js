function initialize() {
    var mapOptions = {
        center: { lat: 53.562261, lng: 9.961613},
        zoom: 15
    };
    var map = new google.maps.Map(document.getElementById('map-canvas'),
                                  mapOptions);
}

function loadScript() {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = '//maps.googleapis.com/maps/api/js?v=3.exp' +
      '&signed_in=true&callback=initialize';
  document.body.appendChild(script);
}

window.onload = loadScript;
