let spotifyApi = {
    client_id: '7c5e232cdb464da0913baf19042cf106',
    client_secret: '0e1ce17da01b4034a92cab1ef28a8bdc',
    scopes: 'playlist-read-private, playlist-read-collaborative',
};

// Message Passing
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
        if (request.action === 'launchAuthFlow') {
            launchAuthFlow();
        }
        if (request.action === 'api/getUserPlaylists') {
            /*api.getUserPlaylists()
                .then(function (result) {
                    sendResponse(result)
                }, function (err) {
                    sendResponse(err)
                });*/
        }
        return true;
    });

function launchAuthFlow() {
    api.getAuthCode();
}

function checkLogin() {
    return getLogin()
        .then(function (result) {
            return true;
        }, function (err) {
            console.log('checkLogin Error: ', err);
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

function setLogin(auth) {
    let login = {
        auth: auth,
    };

    api.getCurrentUser(auth.access_token)
        .then(function (result) {
            Object.assign(login, result); // Merges user info into login object
            chrome.storage.sync.set({login: login}, function () {
                console.log('Login set to: ', login);
                chrome.runtime.sendMessage({action: 'updateDisplay'});
            });
        }, function (err) {
            console.log(err);
        })
}

function checkToken() {
    return new Promise(function (resolve, reject) {
        getLogin()
            .then(function (result) {
                if (checkExpired(result.auth.expiration)) {
                    // Token has expired, use refresh token
                    resolve({refresh: true, auth: result.auth});
                } else {
                    //resolve('Expiration is set to ' + moment(result.auth.expiration).format("dddd, MMMM Do YYYY, h:mm:ss a"));
                    // Current token is fine
                    resolve({refresh: false, auth: result.auth});
                }
            }, function (err) {
                reject(err)
            })
    });
}

function checkExpired(unixTimeVal) {
    return unixTimeVal < moment().valueOf();
}

let api = {
    getAuthCode: function () {
        return new Promise(function (resolve, reject) {
            let client_id = spotifyApi.client_id;
            let redirect_uri = encodeURIComponent(chrome.identity.getRedirectURL());
            // let state = generateRandomString(16);
            let scope = spotifyApi.scopes ? '&scope=' + encodeURIComponent(spotifyApi.scopes) : '';
            let show_dialog = true;

            let settings = {
                url: 'https://accounts.spotify.com/authorize' +
                    '?response_type=code' +
                    '&client_id=' + client_id +
                    scope +
                    '&redirect_uri=' + redirect_uri +
                    '&show_dialog=' + show_dialog
                ,
                interactive: true
            };

            // Launch UI for user to sign into Spotify
            chrome.identity.launchWebAuthFlow(settings,
                // Once user grants permission (or doesn't) this event is called
                function (redirectUrl) {
                    // console.log(redirectUrl);
                    let url = new URL(redirectUrl);
                    let code = url.searchParams.get("code"); // Authorization code used to get a token
                    let error = url.searchParams.get("error");

                    if (code) { 
                        api.getToken(code)
                            .then(function (result) {
                                let token = result.access_token;
                                let refresh_token = result.refresh_token;
                            }, function (err) {
                                console.log(err);
                            })
                    }
                    else if (error) { reject(error) }
                });
        });
    },
    getToken: function (code) {
        return new Promise(function (resolve, reject) {
            if (code) { // If code supplied, get completely new token
                let settings = {
                    "async": true,
                    // "crossDomain": true,
                    "url": "https://accounts.spotify.com/api/token",
                    "method": "Post",
                    "headers": {
                        "cache-control": "no-cache"
                    },
                    "data": {
                        grant_type: 'authorization_code',
                        code: code,
                        redirect_uri: chrome.identity.getRedirectURL(),
                        client_id: spotifyApi.client_id,
                        client_secret: spotifyApi.client_secret
                    }
                };

                $.ajax(settings)
                    .done(function (response) {
                        setLogin(response);
                        resolve(response); // resolves object, not just token
                        // token: response.access_token,
                        // refresh_token: response.refresh_token
                    })
                    .fail(function (err) {
                        reject({error: err});
                    });
            } else { // If no code supplied, check if current token is fine
                checkToken()
                    .then(function (result) {
                        if (!(result.refresh)) { // If current access token exists and is not expired
                            resolve({access_token: result.auth.access_token, msg: 'Token from sync storage'});
                        } else {
                            let refresh_token = result.auth.refresh_token;

                            let settings = {
                                "async": true,
                                // "crossDomain": true,
                                "url": "https://accounts.spotify.com/api/token",
                                "method": "Post",
                                "headers": {
                                    "cache-control": "no-cache"
                                },
                                "data": {
                                    grant_type: 'refresh_token',
                                    refresh_token: refresh_token,
                                    redirect_uri: chrome.identity.getRedirectURL(),
                                    client_id: spotifyApi.client_id,
                                    client_secret: spotifyApi.client_secret
                                }
                            };

                            $.ajax(settings)
                                .done(function (response) {
                                    setLogin(response);
                                    resolve(response);
                                })
                                .fail(function (err) {
                                    reject({error: err});
                                });
                        }
                    }, function (err) {
                        reject({error: err}); // No login info and no code supplied
                    });
            }
        });
    },
    getCurrentUser: function(access_token) {
        return new Promise(function (resolve, reject) {
            let settings = {
                "async": true,
                // "crossDomain": true,
                "url": "https://api.spotify.com/v1/me",
                "method": "Get",
                "headers": {
                    "Authorization": 'Bearer ' + access_token,
                    "cache-control": "no-cache"
                },
                "json": "true"
            };

            $.ajax(settings)
                .done(function (response) {
                    // console.log('Response: ', response);
                    resolve(response);
                })
                .fail(function (err) {
                    reject(err);
                });
        });

    },
    /*getUserPlaylists: function () {
        return new Promise(function (resolve, reject) {
            let settings = {
                "async": true,
                "crossDomain": true,
                "url": "https://api.spotify.com/v1/users/1251570824/playlists?limit=50",
                "method": "GET",
                "headers": {
                    "Authorization": "Bearer " + spotifyApi.login.auth.access_token, // NOPE
                    "cache-control": "no-cache"
                }
            };

            $.ajax(settings)
                .done(function (response) {
                    if (!('error' in response)) {
                        resolve(response);
                    } else if (response.error === 'The access token expired') {
                        // todo refresh token
                    } else {
                        reject(response);
                    }
                })
                .fail(function (response) {
                    reject(response);
                });
        });
    },*/

};