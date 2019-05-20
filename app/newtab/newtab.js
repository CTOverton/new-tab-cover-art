// ========== [ Globals ] ==========
let cover_art = $('#cover_art');
let song_name = $('#song_name');
let artist_name = $('#artist_name');
let preview = null;

$(document).ready(function() {
    displayCoverArt();
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
            cover_art.click(function () {
                if (preview === null) {
                    preview = new Audio(track.preview_url);
                    preview.volume = 0.1;
                    preview.play();
                } else {
                    preview.pause();
                    preview = null;
                }
            })
        } else {
            cover_art.css('background-color', '#616467');
        }
    });
}