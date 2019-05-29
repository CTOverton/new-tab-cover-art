// ========== [ Testing ] ==========
let test_btn = $('#test_btn');

test_btn.click(function () {
    /*console.log('btn clicked')
    chrome.runtime.sendMessage({action: "api/getUserPlaylists"}, function(response) {
        console.log(response)
    });*/
    // displayCurrentUser();
    // chrome.browserAction.getBadgeBackgroundColor({}, function (result) {
    //     console.log(result);
    // })

    // Test login auth
  /*  let login = {
        "auth": {
            "access_token": "BQA5QenQyYaC3CCpIGYXx8UQZMC2nnPShLgXevxqC9QFVo",
            "expiration": 0,
            "expires_in": 3600,
            "refresh_token": "AQBkiVqAj461XQM-O8tpM_kuOub3KVJYINJGLsfbFO6Z803_MqDzywZwr6OJFXTreNtwj7F3WvN7SR734OuWFgANFUVUqDQT_TrQgtnffbZBR0yUcWp4943xyyafu_dPV2gE9g",
            "scope": "playlist-read-private playlist-read-collaborative user-read-email",
            "token_type": "Bearer"
        },
        "display_name": "Christian Overton",
        "email": "overtonzmail@gmail.com",
        "external_urls": {
            "spotify": "https://open.spotify.com/user/1251570824"
        },
        "followers": {
            "href": null,
            "total": 28
        },
        "href": "https://api.spotify.com/v1/users/1251570824",
        "id": "1251570824",
        "images": [
            {
                "height": null,
                "url": "https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/16730162_759001374257510_2090258016787878205_n.jpg?_nc_cat=103&_nc_ht=scontent.xx&oh=71316afaca83541c0ddf77a3fe879ec2&oe=5D594311",
                "width": null
            }
        ],
        "type": "user",
        "uri": "spotify:user:1251570824"
    };

    chrome.storage.sync.set({login: login}, function () {
        console.log('Test Login set to: ', login);
        chrome.runtime.sendMessage({action: 'updateLoginInfo'});
    });*/

    /*chrome.storage.local.getBytesInUse('tracks', function (result) {
        console.log('Bytes in use: ', result, ' %', result / 5242880);
    })*/

    chrome.storage.sync.get('playlist', function (result) {
        console.log(result);
    })

});

// ============================================================


// ========== [ Globals ] ==========
let select_btn = $('#select_btn');
let auth_btn = $('#auth_btn');
let settings_btn = $('#settings_btn');
let support_btn = $('#support_btn');

let login_info = $('#login_info');
let avatar = $('#avatar');
let user_name = $('#user_name');
let user_email = $('#user_email');

let playlist_name = $('#playlist_name');
let playlist_list = $('#playlist_list');

let selectMode = false;

let selected_playlist = {
    name: null,
    id: null
};

$(document).ready(function() {
    checkLogin()
        .then(function (result) {
            updateLoginInfo(result);
            updatePlaylistName();
            login_info.show();
            playlist_name.show();
            select_btn.show();
            settings_btn.show();
            support_btn.show();
        }, function (err) {
            console.log(err);
            logout();
        })
});


// ========== [ UI ] ==========
auth_btn.click(function (e) {
    let btn = $(e.target);
    if (btn.data( "type" ) === 'login') {
        login();
    } else if (btn.data( "type" ) === 'logout') {
        logout();
    }
});

select_btn.click(function () {
    toggleSelectMode();
});

settings_btn.click(function () {
    chrome.tabs.create({url: '/options/options.html'});
    return false;
});

support_btn.click(function () {
    chrome.tabs.create({url: 'https://paypal.me/christianoverton'});
    return false;
});

login_info.click(function () {
    chrome.tabs.create({url: $(this).attr('href')});
    return false;
});

// ========== [ Message Passing ] ==========
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.action === 'updateLoginInfo') {
            updateLoginInfo();
        }
        if (request.action === 'main_view') {
            if (!selectMode) {main_view();}
        }

        return true;
    });

function msg(action, responseCallback) {
    chrome.runtime.sendMessage((typeof action === 'string') ? {action: action} : action, responseCallback ? responseCallback: undefined);
}

// ========== [ Functions ] ==========
function checkLogin() {
    return new Promise(function (resolve, reject) {
        msg('getLogin', function(response) {
            if ('error' in response) {
                reject({error: 'There was an error getting the current login', msg: response});
            } else {
                resolve(response);
            }
        });
    });
}

function updateLoginInfo(login) {
    if (login) {
        setAuthBtn('logout');
        if (login.images.length > 0) {
            avatar.attr('src', login.images[0].url);
        } else {
            avatar.css('background', '#616467');
        }

        user_name.text(login.display_name ? login.display_name : login.id);
        user_email.text(login.email ? login.email : '');
        login_info.attr('href', 'https://open.spotify.com/user/' + login.id);
    } else {
        msg('getLogin', function(response) {
            if ('error' in response) {
                console.log('There was an error getting the current login', response);
                logout();
            } else {
                let login = response;
                setAuthBtn('logout');
                if (login.images.length > 0) {
                    avatar.attr('src', login.images[0].url);
                } else {
                    avatar.css('background', '#616467');
                }
                user_name.text(login.display_name ? login.display_name : login.id);
                user_email.text(login.email ? login.email : '');
                login_info.attr('href', 'https://open.spotify.com/user/' + login.id);
            }
        });
    }
}

function login() {
    console.log('Logging in');
    msg('launchAuthFlow');
}

function logout() {
    console.log('Logging Out');

    login_info.hide();
    playlist_name.hide();
    select_btn.hide();
    settings_btn.hide();
    support_btn.hide();
    avatar.attr('src', '');
    user_name.text('');
    user_email.text('');
    login_info.attr('href', '');
    updatePlaylistName();
    chrome.storage.sync.clear();
    chrome.browserAction.setIcon({
        path: {
            "16": "../assets/icons/default/icon_default_16.png",
            "32": "../assets/icons/default/icon_default_32.png",
            "48": "../assets/icons/default/icon_default_48.png",
            "64": "../assets/icons/default/icon_default_64.png",
            "96": "../assets/icons/default/icon_default_96.png",
            "128": "../assets/icons/default/icon_default_128.png"
        }
    });
    setAuthBtn('login');
}

function setAuthBtn(type) {
    if (type === 'login') {
        auth_btn.removeClass();
        auth_btn.text('Authorize Spotify');
        auth_btn.addClass('bttn bttn-spotify');
        auth_btn.data({type: 'login'});
        auth_btn.show();
    } else if (type === 'logout') {
        auth_btn.removeClass();
        auth_btn.text('Logout');
        auth_btn.addClass('bttn bttn-default');
        auth_btn.data({type: 'logout'});
        auth_btn.show();
    }
}

function toggleSelectMode() {
    if (selectMode) { // If visible, hide
        if (selected_playlist.name !== null && selected_playlist.id !== null) {
            updatePlaylistName();
            msg({action: 'setPlaylist', params: {id: selected_playlist.id, name: selected_playlist.name}});
        }
        main_view();
    } else { // If not visible, show
        playlist_list.empty();
        select_view();
        msg('api/getUserPlaylists', function (response) {
            console.log('response', response);
            let playlists = response.items;
            if (playlists) {
                playlists.forEach(function (playlist, index, array) {
                    let li = document.createElement('li');
                    li = $(li);
                    li.html(playlist.name + "<div class='secondary'>" + playlist.tracks.total + "</div>");
                    li.data('name', playlist.name);
                    li.data('id', playlist.id);
                    if (playlist.id === selected_playlist.id) { li.addClass('selected')}
                    li.click(function (e) {
                        $('li').removeClass();
                        $(e.target).addClass('selected');
                        selected_playlist = {
                            name: $(e.target).data('name'),
                            id: $(e.target).data('id')
                        };
                    });
                    li.dblclick(toggleSelectMode);

                    playlist_list.append(li);
                });
                playlist_list.slideDown();
            } else {
                console.log('error: no items in response: ', response)
            }
        });
    }
    selectMode = !selectMode;
}

function main_view() {
    select_btn.slideDown();
    login_info.slideDown();
    auth_btn.slideDown();
    settings_btn.slideDown();
    support_btn.slideDown();
    playlist_name.slideDown();
    playlist_list.slideUp();
}

function select_view() {
    login_info.slideUp();
    auth_btn.slideUp();
    settings_btn.slideUp();
    support_btn.slideUp();
    playlist_name.slideDown();
}

function updatePlaylistName() {
    if (selected_playlist.name === null) {
        msg('getPlaylist', function (response) {
            if (!('error' in response)) {
                selected_playlist = {
                    name: response.name,
                    id: response.id
                };
                playlist_name.text(selected_playlist.name);
            } else {
                console.log('error', response);
                playlist_name.text('No Playlist Selected');
                chrome.browserAction.setIcon({
                    path: {
                        "16": "../assets/icons/default/icon_default_16.png",
                        "32": "../assets/icons/default/icon_default_32.png",
                        "48": "../assets/icons/default/icon_default_48.png",
                        "64": "../assets/icons/default/icon_default_64.png",
                        "96": "../assets/icons/default/icon_default_96.png",
                        "128": "../assets/icons/default/icon_default_128.png"
                    }
                });
            }
        });
    } else {
        playlist_name.text(selected_playlist.name);
    }
}