// ========== [ Globals ] ==========
let cover_art = $('#cover_art');
let song_name = $('#song_name');
let artist_name = $('#artist_name');
let preview = null;
let settings = null;

$(document).ready(function() {
    chrome.storage.sync.get('settings', result => {
        settings = ('settings' in result) ? result.settings : null;
        displayCoverArt();
    });
    checkDarkMode();
});

// ========== [ Message Passing ] ==========
function msg(action, responseCallback) {
    chrome.runtime.sendMessage((typeof action === 'string') ? {action: action} : action, responseCallback ? responseCallback: undefined);
}

// ========== [ Functions ] ==========
function displayCoverArt() {
    msg('getTracks', function (response) {
        if (!('error' in response)) {
            let tracks = response;
            let track = tracks[Math.floor(Math.random()*tracks.length)];
            console.log(track);
            song_name.text(track.name);
            song_name.attr('href', 'https://open.spotify.com/track/' + track.id);
            artist_name.text(track.artists[0].name);
            artist_name.attr('href', 'https://open.spotify.com/artist/' + track.artists[0].id);
            let art = track.album.images[0].url;
            cover_art.css('background-image', 'url('+ art +')');

            let width = cover_art.outerWidth();
            let height = cover_art.outerHeight();

            let draw = SVG('cover_art').viewbox(0,0, width, height);
            let background = draw.rect('100%','100%').attr({fill: 'rgba(0,0,0,0)'});

            let circle = draw.circle(140,140).attr({fill: 'rgba(0,0,0,0)', stroke: '#fff', 'stroke-width': 4}).center(width/2,height/2);
            let play = 'M81 44.6c5 3 5 7.8 0 10.8L9 98.7c-5 3-9 .7-9-5V6.3c0-5.7 4-8 9-5l72 43.3z';
            let pause = 'M0 8c0-5 3-8 8-8s9 3 9 8v84c0 5-4 8-9 8s-8-3-8-8V8zm43 0c0-5 3-8 8-8s8 3 8 8v84c0 5-3 8-8 8s-8-3-8-8V8z';
            let control_play = draw.path(play).attr({fill: '#fff'}).center(width/2,height/2).scale(0.75);
            let control_pause = draw.path(pause).attr({fill: '#fff'}).center(width/2,height/2).scale(0.75);

            circle.hide();
            control_play.hide();
            control_pause.hide();

            draw.on('svg_in', function() {
                // console.log(e.detail.some);
                circle.show();
                if (preview === null || preview.paused) {
                    control_play.show();
                    control_pause.hide();
                } else {
                    control_play.hide();
                    control_pause.show();
                }

                background.attr({fill: 'rgba(0,0,0,0.3)'});
            });
            draw.on('svg_out', function() {
                circle.hide();
                control_play.hide();
                control_pause.hide();
                background.attr({fill: 'rgba(0,0,0,0)'});
            });

            cover_art.hover(function () {
                draw.fire('svg_in', {some:'in'});
            }, function () {
                draw.fire('svg_out', {some:'out'});
            });

            cover_art.click(function () {
                if (preview === null) {
                    preview = new Audio(track.preview_url);
                    if (settings !== null && 'preview_volume' in settings) {
                        preview.volume = settings.preview_volume / 100;
                    } else {
                        preview.volume = 0.1;
                        chrome.storage.sync.get('settings', result => {
                            let settings = ('settings' in result) ? result.settings : {};
                            settings['preview_volume'] = 10;
                            chrome.storage.sync.set({settings: settings}, function () {
                                console.log('preview_volume set to', 10);
                            });
                        });
                    }
                    preview.crossOrigin = "anonymous";
                    preview.play();
                    control_play.hide();
                    control_pause.show();
                } else {
                    control_play.show();
                    control_pause.hide();
                    preview.pause();
                    preview = null;
                }
            });
            if (settings !== null && 'autoPlay' in settings && settings.autoPlay === true) {
                preview = new Audio(track.preview_url);
                if (settings !== null && 'preview_volume' in settings) {
                    preview.volume = settings.preview_volume / 100;
                } else {
                    preview.volume = 0.1;
                    chrome.storage.sync.get('settings', result => {
                        let settings = ('settings' in result) ? result.settings : {};
                        settings['preview_volume'] = 10;
                        chrome.storage.sync.set({settings: settings}, function () {
                            console.log('preview_volume set to', 10);
                        });
                    });
                }
                preview.crossOrigin = "anonymous";
                preview.play();
            }
        } else {
            cover_art.css('background-color', '#616467');
        }
    });
}

function checkDarkMode() {
    const body = document.querySelector('body');
    const lightMode = {
        '--text-color': '#777a7d',
        '--title-color': '#616467',
        '--bold-title-color': '#777a7d',
        '--subtitle-color': '#777a7d',

        '--bttn-color': '#616467',
        '--bttn-text-color': '#fff',

        '--background-color': '#fff'
    };

    const darkMode = {
        '--text-color': '#fff',
        '--title-color': '#fff',
        '--bold-title-color': '#fff',
        '--subtitle-color': '#e6e6e6',

        '--bttn-color': '#fff',
        '--bttn-text-color': '#191414',

        '--background-color': '#191414'
    };

    function setMode(mode) {
        for (let key in mode) {
            body.style.setProperty(key, mode[key]);
        }
    }

    chrome.storage.sync.get('settings', result => {
        if ('settings' in result) {
            let settings = result.settings;
            if ('darkMode' in settings) {
                if (settings.darkMode === true) {
                    setMode(darkMode);
                } else {
                    setMode(lightMode);
                }
            } else {
                setMode(lightMode);
            }
        }
    });


}
