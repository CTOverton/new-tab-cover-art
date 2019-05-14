// ========== [ Testing ] ==========
let test_btn = $('#test_btn');

test_btn.click(function () {
    /*console.log('btn clicked')
    chrome.runtime.sendMessage({action: "api/getUserPlaylists"}, function(response) {
        console.log(response)
    });*/
    // displayCurrentUser();
    chrome.browserAction.getBadgeBackgroundColor({}, function (result) {
        console.log(result);
    })
});

// ============================================================


// ========== [ Globals ] ==========
let auth_btn = $('#auth_btn');
let select_btn = $('#select_btn');
let login_info = $('#login_info');
let playlist_list = $('#playlist_list');
let avatar = $('#avatar');
let user_name = $('#user_name');
let user_email = $('#user_email');
let selected_playlist_id = null;

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
    let btn = $(e.target);
    login_info.toggle();
    auth_btn.toggle();

    if (playlist_list.css('display') === 'none') {

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
                    selected_playlist_id = $(e.target).data('id');
                });
                li.dblclick(function (e) {
                    msg('setPlaylist(' + $(e.target).data('id') + ')');
                });

                playlist_list.append(li);
            });
            playlist_list.show();
        });
    } else {
        playlist_list.hide();
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
    chrome.runtime.sendMessage({action: action}, responseCallback ? responseCallback: undefined);
}

// ========== [ Functions ] ==========
function displayCurrentUser() {
    msg('getLogin', function(response) {
        if ('error' in response) {
            console.log('There was an error getting the current login', response);
            //chrome.browserAction.setIcon(object details, function callback)
            //https://developer.chrome.com/extensions/browserAction

            login_info.hide();
            select_btn.hide();
            setAuthBtn('login');
        } else {
            setAuthBtn('logout');
            avatar.attr('src', response.images[0].url);
            user_name.text(response.display_name);
            user_email.text(response.email);
            login_info.attr('href', 'https://open.spotify.com/user/' + response.id);
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

    // FAKE LOGIN
    /*chrome.storage.sync.set({
        login: {
            auth: {
                access_token: 'dsfgdfgdfgundefdfgdfgdfgined',
                refresh_token: 'asdasdafgeflkjucvbiemmew',
                expiration: undefined,
            },
            display_name: 'Christian Overton',
            id: '1251570824',
            email: 'christianoverton@ctoverton.com',
            avatar: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/16730162_759001374257510_2090258016787878205_n.jpg?_nc_cat=103&_nc_ht=scontent.xx&oh=71316afaca83541c0ddf77a3fe879ec2&oe=5D594311'
        }
    }, function () {
        updateDisplay()
    });*/

    // REAL LOGIN
    msg('launchAuthFlow')
}

function logout() {
    console.log('Logged Out');
    chrome.storage.sync.clear();
    displayCurrentUser();
}