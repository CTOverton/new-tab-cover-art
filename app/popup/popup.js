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

    let auth = {
        "access_token": "BQB-X6iHkkAI0fikj82aKOH4Ia8cKday09ZxSDnI9L3DtTvQpEjdGcJGZgxS9ZjAS6VnHkVFgXI8DieUWrKvzCcw-sG4-lxCTSWgP4SYBrpkR9TfFBauXlCV2go4HU9MgtFxF_ekvsfBX0h8UCsRGwoOQ3UfiPq1cAwE0mtt",
        "token_type": "Bearer",
        "expires_in": 3600,
        "refresh_token": "AQB9h1dnxb6AV7JB0PZ22aObAOwrxgyipeiRvI5f60PM3NzN9j-W-8Fo-17Tsx9jWlwZJcXT8JqGztQBRQ4aFQT1qxArwwRKcHKjthmIVBI5aFnZMZrunb2sWSOzzYprGkCveQ",
        "scope": "playlist-read-private playlist-read-collaborative",
        "expiration": 0
    };

    // msg({action: 'setLogin', params: auth}, function (response) {
    //     console.log(response);
    // });

    let login = {
        auth: auth,
        display_name: "Christian Overton",
        external_urls: {
            spotify: "https://open.spotify.com/user/1251570824"
        },
        followers: {
            href: null,
            total: 28
        },
        href: "https://api.spotify.com/v1/users/1251570824",
        id: "1251570824",
        images: [
            {
                height: null,
                url: "https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/16730162_759001374257510_2090258016787878205_n.jpg?_nc_cat=103&_nc_ht=scontent.xx&oh=71316afaca83541c0ddf77a3fe879ec2&oe=5D594311",
                width: null
            }
        ],
        type: "user",
        uri: "spotify:user:1251570824"
    };

    chrome.storage.sync.set({login: login}, function () {
        console.log('Test Login set to: ', login);
        chrome.runtime.sendMessage({action: 'displayCurrentUser'});
    });

});

// ============================================================


// ========== [ Globals ] ==========
let auth_btn = $('#auth_btn');
let select_btn = $('#select_btn');
let login_info = $('#login_info');
let playlist_name = $('#playlist_name');
let playlist_list = $('#playlist_list');
let avatar = $('#avatar');
let user_name = $('#user_name');
let user_email = $('#user_email');
let selected_playlist = {
    name: null,
    id: null
};

$(document).ready(function() {
    displayCurrentUser();
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

select_btn.click(function (e) {
    if (playlist_list.css('display') === 'none') {
        login_info.hide();
        auth_btn.hide();
        playlist_list.empty();
        msg('api/getUserPlaylists', function (response) {
            console.log('response', response);
            response.items.forEach(function (playlist, index, array) {
                let li = document.createElement('li');
                li = $(li);
                li.html(playlist.name + "<div class='secondary'>" + playlist.tracks.total + "</div>");
                li.data('name', playlist.name);
                li.data('id', playlist.id);
                li.click(function (e) {
                    $('li').removeClass();
                    $(e.target).addClass('selected');
                    selected_playlist = {
                        name: $(e.target).data('name'),
                        id: $(e.target).data('id')
                    };
                });
                li.dblclick(function (e) {
                    updatePlaylistName();
                    msg({action: 'setPlaylist', params: {id: selected_playlist.id, name: selected_playlist.name}});
                    playlist_list.hide();
                    login_info.show();
                    auth_btn.show();
                });

                playlist_list.append(li);
            });
            playlist_list.show();
        });
    } else {
        if (selected_playlist.name !== null && selected_playlist.id !== null) {
            updatePlaylistName();
            msg({action: 'setPlaylist', params: {id: selected_playlist.id, name: selected_playlist.name}});
        }
        playlist_list.hide();
        login_info.show();
        auth_btn.show();
    }



});

login_info.click(function () {
    chrome.tabs.create({url: $(this).attr('href')});
    return false;
});

// ========== [ Message Passing ] ==========
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.action === 'displayCurrentUser') {
            displayCurrentUser();
        }
        return true;
    });

function msg(action, responseCallback) {
    chrome.runtime.sendMessage((typeof action === 'string') ? {action: action} : action, responseCallback ? responseCallback: undefined);
}

// ========== [ Functions ] ==========
function displayCurrentUser() {
    msg('getLogin', function(response) {
        if ('error' in response) {
            console.log('There was an error getting the current login', response);
            //chrome.browserAction.setIcon(object details, function callback)
            //https://developer.chrome.com/extensions/browserAction

            playlist_name.hide();
            login_info.hide();
            select_btn.hide();
            setAuthBtn('login');
        } else {
            setAuthBtn('logout');
            avatar.attr('src', response.images[0].url);
            user_name.text(response.display_name);
            user_email.text(response.email);
            login_info.attr('href', 'https://open.spotify.com/user/' + response.id);
            updatePlaylistName();
            playlist_name.show();
            login_info.show();
            select_btn.show();
        }
    });
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

function login() {
    console.log('Logging in')
    msg('launchAuthFlow');
}

function logout() {
    console.log('Logged Out');
    chrome.storage.sync.clear();
    displayCurrentUser();
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
                console.log(response, selected_playlist);
            } else {
                console.log('error', response);
                playlist_name.empty();
            }
        });
    } else {
        playlist_name.text(selected_playlist.name);
    }
}