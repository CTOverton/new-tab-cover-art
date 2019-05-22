// ========== [ Globals ] ==========
let spotifyApi = {
    client_id: '7c5e232cdb464da0913baf19042cf106',
    client_secret: '0e1ce17da01b4034a92cab1ef28a8bdc',
    scopes: 'playlist-read-private, playlist-read-collaborative, user-read-email',
};

// ========== [ Events ] ==========
chrome.runtime.onInstalled.addListener(function () {
    chrome.tabs.create({url: "../welcome/welcome.html"});
});

// ========== [ Message Passing ] ==========
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.action === 'setLogin') {
            setLogin(request.params);
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

// ========== [ Functions ] ==========
function launchAuthFlow() {
    api.getAuthCode();
}

function setLogin(auth) {
    Object.assign(auth, {
        expiration: moment().add(auth.expires_in, 's').valueOf()
    });

    let login = {
        auth: auth,
    };

    chrome.storage.sync.set({login: login}, function () {
        console.log('Login auth set: ', login);
        setLoginInfo();
    });
}

function setLoginInfo() {
    getLogin()
        .then(function (result) {
            let login = result;
            api.getCurrentUser()
                .then(function (result) {
                    Object.assign(login, result); // Merges user info into login object
                    chrome.storage.sync.set({login: login}, function () {
                        console.log('Login set to: ', login);
                        chrome.runtime.sendMessage({action: 'updateLoginInfo'});
                        chrome.runtime.sendMessage({action: 'main_view'});
                    });
                }, function (err) {
                    console.log(err);
                })
        }, function (err) {
            console.log(err);
        });
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

function checkToken() {
    return new Promise(function (resolve, reject) {
        getLogin()
            .then(function (result) {
                resolve({refresh: isExpired(result.auth.expiration), auth: result.auth});
            }, function (err) {
                reject(err)
            })
    });
}

function isExpired(unixTimeVal) {
    return unixTimeVal < moment().valueOf();
}

function setTracks() {
    return new Promise(function (resolve, reject) {
        getPlaylist()
            .then(function (result) {
                api.getPlaylistTracks(result.id)
                    .then(function (result) {
                        let tracks = [];

                        for (let i = 0; i < result.length; i++) {
                            let track = result[i].track;
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
                        reject(err);
                    });
            }, function (err) {
                reject(err)
            });
    });
}

function getTracks() {
    return new Promise(function (resolve, reject) {
        getPlaylist()
            .then(function (result) {
                if (result.init === false || isExpired(result.expiration)) { // Get new tracks from api
                    console.log('Getting tracks from Spotify Api');
                    Object.assign(result, {
                        init: true
                    });
                    chrome.storage.sync.set({playlist: result});

                    setTracks()
                        .then(function (result) {
                            resolve(result);
                        }, function (err) {
                            reject(err);
                        })
                } else { // Get tracks from storage
                    console.log('Getting tracks from local storage');
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

function setPlaylist(id, name) {
    getPlaylist()
        .then(function (result) {
            let playlist = {
                name: name,
                id: id,
                expiration: moment().add(1, 'w').valueOf(), // Set to expire in 1 week
                prev_playlist: result,
                init: false
            };

            chrome.storage.sync.set({playlist: playlist}, function () {
                console.log(playlist);
                chrome.browserAction.setIcon({
                    path: {
                        "16": "../assets/icons/active/icon_active_16.png",
                        "32": "../assets/icons/active/icon_active_32.png",
                        "48": "../assets/icons/active/icon_active_48.png",
                        "64": "../assets/icons/active/icon_active_64.png",
                        "96": "../assets/icons/active/icon_active_96.png",
                        "128": "../assets/icons/active/icon_active_128.png"
                    }
                });
            });
        }, function (err) {
            let playlist = {
                name: name,
                id: id,
                expiration: moment().add(1, 'w').valueOf(), // Set to expire in 1 week
                prev_playlist: null,
                init: false
            };

            chrome.storage.sync.set({playlist: playlist}, function () {
                console.log(playlist);
                chrome.browserAction.setIcon({
                    path: {
                        "16": "../assets/icons/active/icon_active_16.png",
                        "32": "../assets/icons/active/icon_active_32.png",
                        "48": "../assets/icons/active/icon_active_48.png",
                        "64": "../assets/icons/active/icon_active_64.png",
                        "96": "../assets/icons/active/icon_active_96.png",
                        "128": "../assets/icons/active/icon_active_128.png"
                    }
                });
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
                    && playlist.expiration !== null
                    && playlist.init !== null) {
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

// ========== [ API ] ==========
let api = {
    call: function (settings) {
        return new Promise(function (resolve, reject) {
            checkToken()
                .then(function (result) {
                    if (result.refresh) { // Get new token using refresh token
                        api.refreshToken()
                            .then(function (result) {
                                Object.assign(settings.headers, {
                                    "Authorization": 'Bearer ' + result.access_token,
                                    "cache-control": "no-cache"
                                });

                                $.ajax(settings)
                                    .done(function (response) {
                                        resolve(response);
                                    })
                                    .catch(function (err) { // Get new token using refresh token
                                        console.log(err);
                                        api.refreshToken()
                                            .then(function (result) {
                                                Object.assign(settings.headers, {
                                                    "Authorization": 'Bearer ' + result.access_token,
                                                    "cache-control": "no-cache"
                                                });

                                                $.ajax(settings)
                                                    .done(function (response) {
                                                        resolve(response);
                                                    })
                                                    .fail(function (err) {
                                                        reject(err);
                                                    })
                                            }, function (err) {
                                                reject(err);
                                            })
                                    });
                            }, function (err) {
                                reject(err);
                            })
                    } else { // Token is fine
                        Object.assign(settings.headers, {
                            "Authorization": 'Bearer ' + result.auth.access_token,
                            "cache-control": "no-cache"
                        });

                        $.ajax(settings)
                            .done(function (response) {
                                resolve(response);
                            })
                            .catch(function (err) { // Get new token using refresh token
                                console.log(err);
                                api.refreshToken()
                                    .then(function (result) {
                                        Object.assign(settings.headers, {
                                            "Authorization": 'Bearer ' + result.access_token,
                                            "cache-control": "no-cache"
                                        });

                                        $.ajax(settings)
                                            .done(function (response) {
                                                resolve(response);
                                            })
                                            .fail(function (err) {
                                                reject(err);
                                            })
                                    }, function (err) {
                                        reject(err);
                                    })
                            });
                    }
                }, function (err) {
                    reject(err);
                });
        });
    },
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
                                resolve(result);
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
                    })
                    .fail(function (err) {
                        reject({error: err});
                    });
            } else { // If no code supplied, check if current token is fine
                checkToken()
                    .then(function (result) {
                        if (!(result.refresh)) { // If current access token exists and is not expired
                            resolve({auth: result.auth, msg: 'Token from sync storage'});
                        } else {
                            api.refreshToken()
                                .then(function (result) {
                                    resolve({auth: result, msg: 'Token from sync storage'});
                                }, function (err) {
                                    reject(err);
                                })
                        }
                    }, function (err) {
                        reject(err);
                    });
            }
        });
    },
    refreshToken: function () {
        console.log('Attempting to refresh token...');
        return new Promise(function (resolve, reject) {
            getLogin()
                .then(function (result) {
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
                            let auth = Object.assign(response, {
                                refresh_token: refresh_token
                            });
                            console.log('Refresh successful', auth);
                            setLogin(auth);
                            resolve(auth);
                        })
                        .fail(function (err) {
                            reject({error: err, msg: 'Refresh Failed'});
                        });
                }, function (err) {
                    reject(err);
                });
        });
    },
    getCurrentUser: function () {
        return new Promise(function (resolve, reject) {
            let settings = {
                "async": true,
                "crossDomain": true,
                "url": "https://api.spotify.com/v1/me",
                "method": "Get",
                "headers": {
                    // "Authorization": 'Bearer ' + access_token, // taken care of by call
                    "cache-control": "no-cache"
                },
                "json": "true"
            };

            api.call(settings)
                .then(function (result) {
                    resolve(result);
                }, function (err) {
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
                            // "Authorization": "Bearer " + result.auth.access_token,
                            "cache-control": "no-cache"
                        }
                    };

                    api.call(settings)
                        .then(function (result) {
                            resolve(result);
                        }, function (err) {
                            reject(err);
                        });
                }, function (err) {
                    reject(err);
                });
        });
    },
    getPlaylistTracks: function (id, prev_tracks, offset, failsafe) {
        return new Promise(function (resolve, reject) {
            let settings = {
                "async": true,
                "crossDomain": true,
                "url": "https://api.spotify.com/v1/playlists/" + id + "/tracks?market=ES" + (offset ? '&offset=' + offset : ''),
                "method": "GET",
                "headers": {
                    // "Authorization": "Bearer " + result.auth.access_token,
                    "cache-control": "no-cache"
                }
            };

            api.call(settings)
                .then(function (result) {
                    let tracks = result.items;
                    if (prev_tracks) {tracks = prev_tracks.concat(tracks);};

                    // Limit amount of recursive calls (failsafe)
                    let recursiveCount = failsafe ? failsafe++ : 1;
                    let limit = 25;

                    if (tracks.length < result.total && recursiveCount < limit) {
                        api.getPlaylistTracks(id, tracks, tracks.length, recursiveCount)
                            .then(function (result) {
                                resolve(result);
                            }, function (err) {
                                reject(err);
                            })
                    } else {
                        resolve(tracks);
                    }
                }, function (err) {
                    reject(err);
                });
        });
    }
};