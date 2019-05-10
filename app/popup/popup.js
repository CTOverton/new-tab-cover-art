let test_btn = $('#test_btn');

test_btn.click(function () {
    chrome.runtime.sendMessage({type: "test"}, function(response) {
        console.log(response)
    });
});

// --------------------------------------------------------------------------------

let auth_btn = $('#auth_btn');

auth_btn.click(function (e) {
    let btn = $(e.target);
    if (btn.data( "type" ) === 'login') {
        login();
    } else if (btn.data( "type" ) === 'logout') {
        logout();
    }
});

$(document).ready(function() {
    checkLogin()
        .then(function (result) {
            console.log(result);
            setAuthBtn('logout');
        }, function (err) {
            console.log(err);
            setAuthBtn('login');
        })
});

function checkLogin() {
    return new Promise(function (resolve, reject) {
        let key = 'login';
        chrome.storage.sync.get([key], result => {
            if (key in result) {
                let login = result[key];
                if ('access_token' in login.auth && 'refresh_token' in login.auth) {
                    resolve(key.display_name + ' is logged in')
                } else {
                    reject('No login auth found')
                }
            } else {
                reject('No login info')
            }
        });
    })
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
    chrome.storage.sync.set({
        login: {
            auth: {
                access_token: 'dsfgdfgdfgundefdfgdfgdfgined',
                refresh_token: 'asdasdafgeflkjucvbiemmew',
                expiration: undefined,
            },
            display_name: 'Christian Overton',
            id: '1251570824',
            avatar: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/16730162_759001374257510_2090258016787878205_n.jpg?_nc_cat=103&_nc_ht=scontent.xx&oh=71316afaca83541c0ddf77a3fe879ec2&oe=5D594311'
        }
    }, function () {
        checkLogin()
            .then(function (result) {
                console.log(result);
                setAuthBtn('logout');
            }, function (err) {
                console.log(err);
                setAuthBtn('login');
            })
    });

    //
}

function logout() {
    console.log('Logged Out');
    chrome.storage.sync.clear();
    setAuthBtn('login');
}

function isExpired(expiration) {
    return expiration < moment().valueOf();
}