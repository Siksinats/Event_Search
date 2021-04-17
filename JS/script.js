//API CONTROLLER

//set id's, secrets, and tokens. FIND A WAY TO MAKE THIS SECURE
const stubhubID = "fUMZxPqMKesBSjoa6ph7G8rBEC83WTbj";
const stubhubSecret = "PY6NatfhUcGCCGAX";
const access_token = "XB4VYsPuVp6qGadktOTiIeyN2rbV";
const spotifyID = "ef2eb13f3386444fba3dd50dce5729b5";
const spotifySecret = "8a14c3acd72442acb0a58a06d2fea867";
var coords = [];

$("document").ready(async () => {
  //on ready set-up and run the necessary API calls.
  $("#query").on("input", debounced(150, _searchListener));
  _getLocation();
  _getStubhubKey();
  _storeSpotifyKey(await _getSpotifyKey());

  // set up initial page HTML
  _initialHtmlHandler(
    _searchPlaylist($("#token").val(), "37i9dQZEVXbMDoHDwVN2tF")
  );

  // initialize listener for the event blade
  $("#event-arrow").on("click", () => {
    let targetWidth = 999;
    if ($(window).width() > targetWidth) {
      _eventDashToggleLarge();
    } else {
      _eventDashToggleSmall();
    }
  });
});
/**
 * Gets the current location of the user and pass it to the saveLocation function to save data for later use
 *
 * @return {number} returns 0 if the loaction is unable to be retrieved either because of allowance, or compatability
 */
const _getLocation = () => {
  var latitude;
  var longitude;
  const _success = (pos) => {
    latitude = pos.coords.latitude;
    longitude = pos.coords.longitude;
    saveLocation(latitude, longitude);
  };

  const _error = () => {
    alert("Unable to retrive your location.");
    return 0;
  };

  if (!navigator.geolocation) {
    alert(
      "Geolocation is not supported by your browser. We will be unable to reccomend events based off of your location"
    );
    return 0;
  } else {
    navigator.geolocation.getCurrentPosition(_success, _error,  {timeout: 30000, enableHighAccuracy: true, maximumAge: 75000});
  }
};

/**
 * Saves the location of the user to the global variable 'coords'
 *
 * @param {number} lat latitude of user
 * @param {number} long longitute of use
 */
const saveLocation = (lat, long) => {
  coords = [lat, long];
};

// Get the Stubhub token necessary to make API calls
const _getStubhubKey = async () => {
  const response = await fetch(
    "https://api.stubhub.com/sellers/oauth/accesstoken?grant_type=client_credentials",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(stubhubID + ":" + stubhubSecret),
      },
      body: {
        username: "T.Staniskis@gmail.com",
        password: "Mj8fat8g1!",
      },
    }
  );
  const data = await response.json();
};

/**
 *Gets all of the events from the stubhub 'Search Event' API
 *
 * @param {string} access_token The access token that allows for API calls on stubhub API's
 * @param {string} name The name of the artist that we are searching for events
 * @return {object} A list of events and details
 */
const _getEvents = async (access_token, name) => {
  const response = await fetch(
    `https://api.stubhub.com/sellers/search/events/v3?name=${name}&rows=500&sort=eventDateLocal asc`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + access_token,
        Aceept: "application/json",
      },
    }
  );
  const data = await response.json();
  return data.events;
};
/**
 * Checks the distance of an array of events against the users location and places them into applicable array
 *
 * @param {array} events An array of events to check distances against user location
 * @return {object} An object consisting of two arrays which consist of the near events and far events
 */
const _eventDistanceCheck = async (events) => {
  const closeEventList = [];
  const otherEvents = [];

  $(await events).each(async (index, element) => {
    if (
      getDistanceFromLatLonInMiles(
        coords[0],
        coords[1],
        element.venue.latitude,
        element.venue.longitude
      ) < 50
    ) {
      closeEventList.push(element);
    } else {
      otherEvents.push(element);
    }
  });
  return {
    nearEvents: closeEventList,
    farEvents: otherEvents,
  };
};
/**
 *Gets the distance between two latitude and longitude sets
 *
 * @param {number} lat1 latitude of point one
 * @param {number} lon1 longitude of point one
 * @param {number} lat2 latitude of point two
 * @param {number} lon2 longitude of point two
 * @return {number} the disatnce beteen the two sets in miles
 */
const getDistanceFromLatLonInMiles = (lat1, lon1, lat2, lon2) => {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  d = d * 0.62137; // Distance in miles
  return d;
};
/**
 *Converts degrees to radians
 *
 * @param {number} deg degrees
 * @return {number} radians
 */
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

/**
 *Retrieves the spotify token that allows for further API calls
 *
 * @return {string} the access token needed for future spotify API calls
 */
const _getSpotifyKey = async () => {
  const response = await fetch(
    "https://accounts.spotify.com/api/token?grant_type=client_credentials",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(spotifyID + ":" + spotifySecret),
      },
    }
  );
  const data = await response.json();
  return data.access_token;
};
/**
 *  Stores Spotify's API token to an invisible input
 *
 * @param {string} token Spotify's API token
 */
const _storeSpotifyKey = (token) => {
  $("body").append(`<input id="token" class="hidden" value="${token}" />`);
};
/**
 * Searches the Spotify Search API for artists
 *
 * @param {string} token Spotify API token that allows for API call
 * @param {string} query Who we are looking to find
 * @return {array} array of objects
 */

const _search = async (token, query) => {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=artist&limit=50`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const data = await response.json();
  return data.artists.items;
};
/**
 * Searches the Spotify API for a playlist by the supplied name
 *
 * @param {string} token Spotify token used to make API calls
 * @param {string} query What playlist we are trying to find
 * @return {array} Array of items that are in the playlist
 */
const _searchPlaylist = async (token, query) => {
  const responseOne = await fetch(
    `https://api.spotify.com/v1/playlists/${query}`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const dataOne = await responseOne.json();
  return dataOne.tracks.items;
};

/**
 * Gets the artist's Spotify ID
 *
 * @param {DOM element} target the target of the click event
 * @return {string} the Spotify ID of the artist
 */
const _getArtistId = (target) => {
  return target.attr("id");
};

/**
 * Retrieves albums related to the query from the Spotify search API
 *
 * @param {string} token Spotify's API token needed to make API calls
 * @param {string} query The value of the query to search by
 * @return {array} array of objects that describe the related albums
 */
const _getAlbums = async (token, query) => {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=album`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const data = await response.json();
  console.log(data.albums.items);
  return data.albums.items;
};

/**
 *
 *
 * @param {string} token Token needed to make requests to spotify search API
 * @param {string} query what we are searching the Spotify search API for
 * @return {array} list of tracks objects
 */
const _getTracks = async (token, query) => {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=track`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const data = await response.json();
  return data.tracks.items;
};
/**
 * Filters artists so there are no repeats
 *
 * @param {array} artists Array of tracks to filter through
 * @return {array} Array of objects that have been filtered by Artists name
 */
const _filterArtists = async (tracks) => {
  var filteredArtistsName = [];
  var filteredArtists = [];
  $(await tracks).each((index, element) => {
    if (filteredArtistsName.includes(element.name) === false) {
      filteredArtistsName.push(element.name);
      filteredArtists.push(element);
    }
  });
  return filteredArtists;
};
/**
 * Filters albums so there are no repeats
 *
 * @param {array} albums Array of albums to filter through
 * @return {array} Array of objects of the filtered albums
 */
const _filterAlbums = async (albums) => {
  var filteredAlbumName = [];
  var filteredAlbums = [];
  $(await albums).each((index, element) => {
    if (filteredAlbumName.includes(element.name) === false) {
      filteredAlbumName.push(element.name);
      filteredAlbums.push(element);
    }
  });
  return filteredAlbums;
};

// UI CONTROLLER

/**
 *  Handles the information that will be used to populate the page on load
 *
 * @param {Array} items The list of objects that will be parsed, filtered, and pushed to html
 */
const _initialHtmlHandler = async (items) => {
  var artists = [];
  var tracks = [];
  var albums = [];

  $(await items).each((index, element) => {
    artists.push({
      name: element.track.artists[0].name,
      id: element.track.artists[0].id,
      images: [element.track.album.images[1]],
    });

    tracks.push({
      name: element.track.name,
      album: { images: [{ url: element.track.album.images[1].url }] },
    });

    albums.push({
      name: element.track.album.name,
      id: element.track.album.id,
      images: [element.track.album.images[1]],
    });
  });
  _generateArtistHTML(await _filterArtists(artists));

  _generateTrackHTML(tracks);

  _generateAlbumHTML(_filterAlbums(albums));
};

const _generateArtistHTML = async (data) => {
  $(await data).each(function (index, element) {
    let img = "";
    const name = element.name;
    const id = element.id;

    if (element.images[0] !== undefined) {
      img = element.images[0].url;
    } else {
      img = "../Images/placeholder.png";
    }
    var html = `
        <div id='${id}'class='result'>
          <img src='${img}'/>
          <div class='result-info'>
            <h3>${name}</h3>
            <p>Artist</p>
          </div>
        </div>`;

    $("#artist-container").append(html);
  });

  _assignArtistListener();
};
/**
 * Generates and posts html inside of the Track Container
 *
 * @param {array} tracks array of objects used to populate each result card
 */
const _generateTrackHTML = async (tracks) => {
  console.log(tracks)
  $(await tracks).each((index, element) => {
    let img = element.album.images[0].url;
    let html = `
    <div class='result track'>
      <img src='${img}'>
      <div class='result-info'>
        <p>${element.name}</p>
        </div>
    </div>`;

    $("#track-container").append(html);
  });
};
/**
 *  Generates and posts html inside of the Album Container
 *
 * @param {array} albums array of aobject used to populate each reasult card
 */
const _generateAlbumHTML = async (albums) => {
  $(await albums).each((index, element) => {
    let img = element.images[0].url;
    var html = `
    <div id='${element.id}' class='result album'>
      <img src=${img}
      <div class='result-info'>
        <h3>${element.name}</h3>
      </div>
      
    </div>`;

    $("#album-container").append(html);
  });
};

/**
 * Generates and posts html inside Event Container depending on distance of event from user
 *
 * @param {array} eventObj array of event objects that describe each event
 */
const _generateEventHTML = async (eventObj) => {
  let events = await eventObj;
  console.log(events)
  let eventContainers = `
  <div id="near-event-container">
    <h3>Events Near You:</h3>
  </div>
  <div id="far-event-container">
    <h3>All Events:</h3>
  </div>`

  $('#default-event-message').remove()
  $('#near-event-container').remove()
  $('#far-event-container').remove()
  $('#no-event-message').remove();

  if(events.nearEvents.length == 0 && events.farEvents.length == 0) {

    let html = `
    <div id='no-event-message'>
      <h3>This artist currently does not have any events scheduled. Try a different artist!</h3>
    </div>
    `
    $("#event-container").append(html);
  } else {
    $('#event-container').append(eventContainers)

    $(await events.nearEvents).each(async (index, element) => {
      let dateObj = _timeConvert(Date.parse(element.eventDateUTC));
      let ticketPrice = _checkTicketPrice(
        element.ticketInfo.totalListings,
        element.ticketInfo.minListPrice
      );
  
      let html = `
      <div class='event'>
          <div class='event-column'>
            <p class='small'>${dateObj.time}</p>
            <p class='bold'>${dateObj.date}</p>
          </div>
          <div class='event-column'>
            <p class='small'>${element.venue.name}</p>
            <p class='bold'>${element.venue.city}, ${element.venue.state}, ${element.venue.country}</p>
            <p class='light small'>${element.name}</p>
          </div>
          <div class='event-column'>
            <p class='small'>from</p>
            <p class='bold'>${ticketPrice}</p>
          </div>
        </div>
      `;
      $("#near-event-container").append(html);
    });

    $(await events.farEvents).each(async (index, element) => {
      let id = element.id;
      let dateObj = _timeConvert(Date.parse(element.eventDateUTC));
      let ticketPrice = _checkTicketPrice(
        element.ticketInfo.totalListings,
        element.ticketInfo.minListPrice
      );
  
      let html = `
      <div id = ${id} class='event'>
          <div class='event-column'>
            <p class='small'>${dateObj.time}</p>
            <p class='bold'>${dateObj.date}</p>
          </div>
          <div class='event-column'>
            <p class='small'>${element.venue.name}</p>
            <p class='bold'>${element.venue.city}, ${element.venue.state}, ${element.venue.country}</p>
            <p class='light small'>${element.name}</p>
          </div>
          <div class='event-column'>
            <p class='small'>from</p>
            <p class='bold'>${ticketPrice}</p>
          </div>
        </div>
      `;
      $("#far-event-container").append(html);
      $(`#${id}`).on("click", (e) => {
        stubhubTicketRedirect($(e.target).attr("id"));
      });
    });
  }
};

/**
 * Redirects user to the Stubhub event page for the selected event
 *
 * @param {*} id
 */
const stubhubTicketRedirect = (id) => {
  window.open(`https://www.stubhub.com/event/${id}/`, "_blank");
};

/**
 * Checks to see if there are tickets available.
 *
 * @param {object} listings The event object to check
 * @param {number} price The price of the ticket if one exists
 * @return {string} A string of the lowest price of ticket available or message if one does not exist
 */
const _checkTicketPrice = (listings, price) => {
  if (listings === 0) {
    return "none available";
  } else {
    return `$${price}`;
  }
};
/**
 * Converts timestamp into a Month-Day-Year-Hours format.
 *
 * @param {string} time Time that is to be converted
 * @return {string} Time converted
 */
const _timeConvert = (time) => {
  // Months array
  var months_arr = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  // Convert timestamp to date
  var date = new Date(time);
  // Year
  var year = date.getFullYear();
  // Month
  var month = months_arr[date.getMonth()];
  // Day
  var day = date.getDate();
  // Hours
  var hours = date.getHours();
  // Minutes
  var minutes = "0" + date.getMinutes();
  // Seconds
  var seconds = "0" + date.getSeconds();
  // Display date time in MM-dd-yyyy h:m:s format
  var convdataTime = {
    date: month + "-" + day + "-" + year,
    time: hours + ":" + minutes.substr(-2) + ":" + seconds.substr(-2),
  };

  return convdataTime;
};

// Empty Artists Container
const _artistsEmpty = () => {
  $("#artist-container").empty();
};

// Empty Tracks Container
const _tracksEmpty = () => {
  $("#track-container").empty();
};

// Empty Albums Container
const _albumEmpty = () => {
  $("#album-container").empty();
};

// Empty Events Container
const _eventsEmpty = () => {
  console.log("hi");
  $(".event").remove();
};





// Event Listeners

/**
 * Used to delay a function from firing
 *
 * @param {number} delay The amount of time you wish the function to be delayed by (in ms)
 * @param {function} fn The function that is to be delayed
 */
const debounced = (delay, fn) => {
  let timerId;
  return function (...args) {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      fn(...args);
      timerId = null;
    }, delay);
  };
};

// The listener to be attached to the searchbar
const _searchListener = () => {
  //empty albums shown
  _albumEmpty();
  //empty artists shown
  _artistsEmpty();
  //empty tracks shown
  _tracksEmpty();
  //generate and post artist html
  _generateArtistHTML(_search($("#token").val(), $("#query").val()));
  //generate and post tracks html
  _generateTrackHTML(_getTracks($("#token").val(), $("#query").val()));
  //generate and post album html
  _generateAlbumHTML(_getAlbums($("#token").val(), $("#query").val()));
};

// The listener to be assigned to each artist card
const _assignArtistListener = () => {
  $(".result").on("click", (e) => {
    //remove current posted events
    _eventsEmpty();
    //generate and post artist events
    _generateEventHTML(
      _eventDistanceCheck(
        _getEvents(access_token, $(e.target).find("h3")[0].innerText)
      )
    );
    let targetWidth = 999;
    if ($(window).width() > targetWidth) {
      _eventDashOpenLarge();
    } else {
      _eventDashOpenSmall();
    }
  });
};

// Toggles between opening and closing the event dashboard on sizes over 1000px
const _eventDashToggleLarge = () => {
  if ($("#event-arrow").hasClass("closed")) {
    _eventDashOpenLarge();
  } else {
    _eventDashCloseLarge();
  }
};

// Toggles between opening and closing the event dashboard on sizes under 1000px
const _eventDashToggleSmall = () => {
  if ($("#event-arrow").hasClass("closed")) {
    _eventDashOpenSmall();
  } else {
    _eventDashCloseSmall();
  }
};

// Opens the event dashboard and resize ui to fit on sizes over 1000px
const _eventDashOpenSmall = () => {
  $("#event-container").css({ right: "0px" });

  $("#event-arrow").removeClass("closed");
  $("#event-arrow").addClass("open");

  $("#results-container").css({ width: "60%" });
  $(".result-list").css({ height: "60vw" });

  $("#search-container").css({ width: "60%" });
};

// Closes the event dashboard and resize ui to fit on sizes over 1000px
const _eventDashCloseSmall = () => {
  $("#event-container").css({ right: "-100%" });

  $("#event-arrow").removeClass("open");
  $("#event-arrow").addClass("closed");

  $("#results-container").css({ width: "100%" });
  $(".result-list").css({ height: "100vw" });

  $("#search-container").css({ width: "100%" });
};

// Opens the event dashboard and resize ui to fit on sizes under 1000px
const _eventDashOpenLarge = () => {
  $("#event-container").css({ right: "0px" });

  $("#event-arrow").removeClass("closed");
  $("#event-arrow").addClass("open");

  $("#results-container").css({ width: "60%" });
  $(".result-list").css({ height: "60vw" });

  $("#search-container").css({ width: "60%" });
};

// Closes the event dashboard and resize ui to fit on sizes under 1000px
const _eventDashCloseLarge = () => {
  $("#event-container").css({ right: "-100%" });

  $("#event-arrow").removeClass("open");
  $("#event-arrow").addClass("closed");

  $("#results-container").css({ width: "100%" });
  $(".result-list").css({ height: "100vw" });

  $("#search-container").css({ width: "100%" });
};






