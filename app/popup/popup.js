// ========== [ Testing ] ==========
let test_btn = $('#test_btn');

test_btn.click(function () {
    /*console.log('btn clicked')
    chrome.runtime.sendMessage({action: "api/getUserPlaylists"}, function(response) {
        console.log(response)
    });*/
    displayCurrentUser();
});

// ============================================================


// ========== [ Globals ] ==========
let auth_btn = $('#auth_btn');
let login_info = $('#login_info');
let avatar = $('#avatar');
let user_name = $('#user_name');
let user_email = $('#user_email');

$(document).ready(function() {
    updateDisplay();
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

login_info.click(function () {
    chrome.tabs.create({url: $(this).attr('href')});
    return false;
});

// ========== [ Message Passing ] ==========
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.action === 'updateDisplay') {
            updateDisplay();
        }
        return true;
    });

// ========== [ Functions ] ==========
function updateDisplay() {
    background('checkLogin', function(response) {
        if (!response) { // Not logged in
            setAuthBtn('login');
        } else { // Logged in
            displayCurrentUser();
            setAuthBtn('logout');
        }
    });
}

function background(action, responseCallback) {
    chrome.runtime.sendMessage({action: action}, responseCallback ? responseCallback: undefined);
}

function displayCurrentUser() {
    background('getLogin', function(response) {
        if ('error' in response) {
            console.log('There was an error getting the current login', response)
        } else {
            avatar.attr('src', response.images[0].url);
            user_name.text(response.display_name);
            user_email.text(response.email);
            login_info.attr('href', 'https://open.spotify.com/user/' + response.id);
            login_info.show();
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
    background('launchAuthFlow')
}

function logout() {
    console.log('Logged Out');
    chrome.storage.sync.clear();
    login_info.hide();
    setAuthBtn('login');
}

function isExpired(expiration) {
    return expiration < moment().valueOf();
}