let spotifyApi = {
    client_id: '7c5e232cdb464da0913baf19042cf106',
    client_secret: '0e1ce17da01b4034a92cab1ef28a8bdc',
    scopes: 'playlist-read-private, playlist-read-collaborative',
};

// let playlist = {
//     name: undefined,
//     id: undefined,
//     expiration: undefined,
// };

// Message Passing
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
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
        if (request.action === 'setPlaylist') {
            setPlaylist(request.params.id, request.params.name);
        }
        if (request.action === 'getPlaylist') {
            getPlaylist()
                .then(function (result) {
                    sendResponse(result);
                },
                function (err) {
                    sendResponse(err);
                });
        }
        if (request.action === 'getTracks') {
            getTracks()
                .then(function (result) {
                    sendResponse(result);
                },
                function (err) {
                    sendResponse(err);
                });
        }
        if (request.action === 'api/getUserPlaylists') {
            api.getUserPlaylists()
                .then(function (result) {
                    sendResponse(result)
                }, function (err) {
                    sendResponse(err)
                });
        }
        return true;
    });

function launchAuthFlow() {
    api.getAuthCode();
}

function getLogin() {
    return new Promise(function (resolve, reject) {
        let key = 'login';
        chrome.storage.sync.get([key], result => {
            if (key in result) {
                let login = result[key];
                if ('access_token' in login.auth
                    && 'refresh_token' in login.auth
                    && 'expiration' in login.auth) {
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
    Object.assign(auth, {
        expiration: moment().add(auth.expires_in, 's').valueOf()
    });

    let login = {
        auth: auth,
    };

    api.getCurrentUser(auth.access_token)
        .then(function (result) {
            Object.assign(login, result); // Merges user info into login object
            chrome.storage.sync.set({login: login}, function () {
                console.log('Login set to: ', login);
                chrome.runtime.sendMessage({action: 'displayCurrentUser'});
                //chrome.browserAction.setIcon(object details, function callback)
                //https://developer.chrome.com/extensions/browserAction
            });
        }, function (err) {
            console.log(err);
        })
}

function checkToken() {
    return new Promise(function (resolve, reject) {
        getLogin()
            .then(function (result) {
                if (isExpired(result.auth.expiration)) {
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

function isExpired(unixTimeVal) {
    return unixTimeVal < moment().valueOf();
}

function setPlaylist(id, name) {
    let playlist = {
        name: name,
        id: id,
        expiration: moment().add(1, 'w').valueOf(), // Set to expire in 1 week
    };

    chrome.storage.sync.set({playlist: playlist}, function () {
        console.log(playlist);
    });
}

function setTracks() {
    return new Promise(function (resolve, reject) {
        api.getPlaylistTracks(id)
            .then(function (result) {
                let tracks = [];

                for (let i = 0; i < result.items.length; i++) {
                    let track = result.items[i].track;
                    // strip down tracks to lower data size (take just the necessary values)
                    tracks.push({
                        album: {
                            id: track.album.id,
                            name: track.album.name,
                            images: track.album.images
                        },
                        artists: track.artists,
                        id: track.id,
                        name: track.name,
                        preview_url: track.preview_url,
                    });
                }

                // Set tracks locally because over sync quota (102.4kb)
                chrome.storage.local.set({tracks: tracks}, function () {
                    resolve(tracks);
                });
            }, function (err) {
                reject('err', err);
            });
    });
}

function getPlaylist() {
    return new Promise(function (resolve, reject) {
        let key = 'playlist';
        chrome.storage.sync.get([key], result => {
            if (key in result) {
                let playlist = result[key];
                if (playlist.name !== null
                    && playlist.id !== null
                    && playlist.expiration !== null) {
                    resolve(playlist);
                } else {
                    reject({error: 'No playlist data found in sync storage'});
                }
            } else {
                reject({error: 'No playlist variable found in sync storage'});
            }
        });
    });
}

function getTracks() {
    return new Promise(function (resolve, reject) {
        getPlaylist()
            .then(function (result) {
                if (isExpired(result.expiration)) { // If expired, get new tracks from api
                    setTracks()
                        .then(function (result) {
                            resolve(result);
                        }, function (err) {
                            reject(err);
                        })
                } else { // Get tracks from storage
                    let key = 'tracks';
                    chrome.storage.local.get([key], result => {
                        if (key in result) { // Use current tracks
                            let tracks = result[key];
                            resolve(tracks);
                        } else {
                            setTracks()
                                .then(function (result) {
                                    resolve(result);
                                }, function (err) {
                                    reject(err);
                                })
                        }
                    });
                }
            }, function (err) {
                reject(err);
            });
    });
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
                    } else if (error) {
                        reject(error)
                    }
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
    getCurrentUser: function (access_token) {
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
    getUserPlaylists: function () {
        return new Promise(function (resolve, reject) {
            getLogin()
                .then(function (result) {
                    let settings = {
                        "async": true,
                        "crossDomain": true,
                        "url": "https://api.spotify.com/v1/users/" + result.id + "/playlists?limit=50",
                        "method": "GET",
                        "headers": {
                            "Authorization": "Bearer " + result.auth.access_token,
                            "cache-control": "no-cache"
                        }
                    };

                    $.ajax(settings)
                        .done(function (response) {
                            resolve(response);
                        })
                        .fail(function (response) {
                            if (response.responseJSON.error.message === 'The access token expired') {
                                // Attempt to refresh token
                                api.getToken()
                                    .then(function (result) {
                                        resolve(api.getUserPlaylists());
                                    }, function (err) {
                                        reject(err);
                                    });
                            } else {
                                reject(response);
                            }
                        });
                }, function (err) {
                    reject(err);
                });
        });
    },
    getPlaylistTracks: function (id) {
        // TODO: If playlist tracks are > 100 (aka response.next != null, get next 100 tracks
        return new Promise(function (resolve, reject) {
            checkToken()
                .then(function (result) {
                    if (result.refresh) {
                        api.getToken()
                            .then(function (result) {
                                resolve(api.getPlaylistTracks());
                            }, function (err) {
                                reject(err);
                            });
                    } else {
                        let settings = {
                            "async": true,
                            "crossDomain": true,
                            "url": "https://api.spotify.com/v1/playlists/" + id + "/tracks?market=ES",
                            "method": "GET",
                            "headers": {
                                "Authorization": "Bearer " + result.auth.access_token,
                                "cache-control": "no-cache"
                            }
                        };

                        $.ajax(settings)
                            .done(function (response) {
                                resolve(response);
                            })
                            .fail(function (response) {
                                if (response.responseJSON.error.message === 'The access token expired') {
                                    // Attempt to refresh token
                                    api.getToken()
                                        .then(function (result) {
                                            resolve(api.getUserPlaylists());
                                        }, function (err) {
                                            reject(err);
                                        });
                                } else {
                                    reject(response);
                                }
                            });
                    }
                }, function (err) {
                    reject(err);
                });
        });
    }
};