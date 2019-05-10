let spotifyApi = {
    client_id: '7c5e232cdb464da0913baf19042cf106',
    client_secret: '0e1ce17da01b4034a92cab1ef28a8bdc',
    scopes: 'playlist-read-private, playlist-read-collaborative',
    login: {
        auth: {
            access_token: undefined,
            refresh_token: undefined,
            expiration: undefined,
        },
        display_name: 'Christian Overton',
        id: '1251570824',
        avatar: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/16730162_759001374257510_2090258016787878205_n.jpg?_nc_cat=103&_nc_ht=scontent.xx&oh=71316afaca83541c0ddf77a3fe879ec2&oe=5D594311'
    }
};

function updateLocalApiInfo() {
    console.log('Updating Local Api Info');
    let key = 'spotifyApi';
    chrome.storage.sync.get([key], result => {
        if (key in result) {
            let updates = ['access_token', 'refresh_token', 'expiration'];

            updates.forEach(update => {
                if (result[key][update]) {
                    spotifyApi[update] = result[key][update];
                    console.log(update, ' = ', result[key][update]);
                } else {
                    console.log(update, ' Was not found');
                }
            });
        } else {
            console.log('spotifyApi not found')
        }
    });
}

function api_getTracks() {
    return new Promise(function (resolve, reject) {

    })
}

function api_getUserPlaylists() {
    return new Promise(function (resolve, reject) {
        let settings = {
            "async": true,
            "crossDomain": true,
            "url": "https://api.spotify.com/v1/users/1251570824/playlists?limit=50",
            "method": "GET",
            "headers": {
                "Authorization": "Bearer " + spotifyApi.access_token,
                "cache-control": "no-cache"
            }
        };

        $.ajax(settings).done(function (response) {
            console.log('api_getUserPlaylists: ', response);
            if (!('error' in response)) {
                resolve(response);
            } else if (response.error === 'The access token expired') {
                
            }
        });
    })
}

function api_getToken() {

}