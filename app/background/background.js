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
        email: 'christianoverton@ctoverton.com',
        avatar: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/16730162_759001374257510_2090258016787878205_n.jpg?_nc_cat=103&_nc_ht=scontent.xx&oh=71316afaca83541c0ddf77a3fe879ec2&oe=5D594311'
    }
};

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.action === 'checkLogin') {
            checkLogin()
                .then(function (result) {
                    sendResponse(result);
                });
        }
        if (request.action === 'getLogin') {
            getLogin()
                .then(function (result) {
                        sendResponse(result);
                    },
                    function (err) {
                        sendResponse(err);
                    });
        }
        if (request.action === 'api/getUserPlaylists') {
            api.getUserPlaylists(sendResponse);
        }
        return true;
    });

function checkLogin() {
    return getLogin()
        .then(function (result) {
            return true;
        }, function (err) {
            return false;
        })
}

function getLogin() {
    return new Promise(function (resolve, reject) {
        let key = 'login';
        chrome.storage.sync.get([key], result => {
            if (key in result) {
                let login = result[key];
                if ('access_token' in login.auth && 'refresh_token' in login.auth) {
                    resolve(login);
                } else {
                    reject({error: 'No login auth found'})
                }
            } else {
                reject({error: 'No login info'})
            }
        });
    })
}


let api = {
    getUserPlaylists: function (callback) {
        let settings = {
            "async": true,
            "crossDomain": true,
            "url": "https://api.spotify.com/v1/users/1251570824/playlists?limit=50",
            "method": "GET",
            "headers": {
                "Authorization": "Bearer " + spotifyApi.login.auth.access_token,
                "cache-control": "no-cache"
            }
        };

        $.ajax(settings)
            .done(function (response) {
                if (!('error' in response)) {
                    callback(response);
                } else if (response.error === 'The access token expired') {
                    // todo refresh token
                } else {
                    callback(response);
                }
            })
            .fail(function (response) {
                callback(response);
            });
    }
};