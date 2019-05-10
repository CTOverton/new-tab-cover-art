let spotifyApi = {
    client_id: '7c5e232cdb464da0913baf19042cf106',
    client_secret: '0e1ce17da01b4034a92cab1ef28a8bdc',
    scopes: 'playlist-read-private, playlist-read-collaborative',
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type == "api/getUserPlaylists"){
            api.getUserPlaylists(sendResponse);
            return true;
        }
        return true;
    });

let api = {
    getUserPlaylists: function (callback) {
        let settings = {
            "async": true,
            "crossDomain": true,
            "url": "https://api.spotify.com/v1/users/1251570824/playlists?limit=50",
            "method": "GET",
            "headers": {
                // "Authorization": "Bearer " + , Todo
                "cache-control": "no-cache"
            }
        };

        $.ajax(settings).done(function (response) {
            console.log('api_getUserPlaylists: ', response);
            if (!('error' in response)) {
                callback(response);
            } else if (response.error === 'The access token expired') {

            }
        });
    }
};