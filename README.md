# Neighborhood Map
A project from Udacity's Front-end Web Developer Nano degree.

It can be used to create a neighborhood map like the following:

<img src="https://github.com/andreaswachowski/udacity-frontend-p5-neighborhood-map/blob/master/screenshot.png" height=auto width="100%">

After centering/zooming the
map to the desired area (it is initially set to an area in Hamburg, Germany),
click on the map to create markers. The clicked places will be displayed in a
list shown on top of the map.

You can edit the title of a location by double-clicking on the corresponding
list entry (or clicking its edit button). A single click pans to the selected
marker.

# Installation
Clone the repository and open `index.html`. 

To enable foursquare API access, you need a foursquare client id and client
secret (see [Connecting to the FourSquare
API](https://developer.foursquare.com/overview/auth)). Use those to
initialize `FOURSQUARE_CLIENT_ID` and `FOURSQUARE_CLIENT_SECRET` at the top
of `app/js/app.js`.

# Resources
* [todomvc](https://github.com/tastejs/todomvc/tree/gh-pages) for the marker list
* [Google Maps APIs](https://developers.google.com/maps/)

# Remarks:
* No attempt is being made at making the project work across older
  browsers. For example, the CSS is not using any specific browser prefixes
  (for that, I would employ
  [grunt-autoprefixer](https://github.com/nDmitry/grunt-autoprefixer)).
* CSS is intentionally on the light side, so no Bootstrap or Foundation.
