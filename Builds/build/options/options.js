$('.link').click(function (e) {
    window.open($(e.target).attr('href'));
});

$(document).ready(function() {
    getSettings();
    checkDarkMode();
});


$('#settings').find('input').change(function (e) {
    let input = $(e.target);
    let key = input.attr('id');
    let value = null;
    if (input.attr('type') === 'checkbox') { value = input.is(':checked');}
    if (input.attr('type') === 'range') { value = input.val();}
    chrome.storage.sync.get('settings', result => {
        let settings = ('settings' in result) ? result.settings : {};
        settings[key] = value;
        chrome.storage.sync.set({settings: settings}, function () {
            console.log(key + ' set to', value);
            checkDarkMode();
        });
    });
});

function getSettings() {
    let inputs = $('#settings').find('input');
    chrome.storage.sync.get('settings', result => {
        if ('settings' in result) {
            let settings = result.settings;
            inputs.each(function (index, element) {
                let input = $(element);
                let key = input.attr('id');
                if (key in settings) {
                    if (input.attr('type') === 'checkbox') { input.prop('checked', settings[key]) }
                    if (input.attr('type') === 'range') { input.val(settings[key]) }
                } else {
                    if (key === 'preview_volume') {
                        chrome.storage.sync.get('settings', result => {
                            let settings = ('settings' in result) ? result.settings : {};
                            settings['preview_volume'] = 10;
                            chrome.storage.sync.set({settings: settings}, function () {
                                input.val(settings[key]);
                                console.log('preview_volume set to', 10);
                            });
                        });
                    }
                }
            })
        } else {
            let settings = {};
            settings['preview_volume'] = 10;
            chrome.storage.sync.set({settings: settings}, function () {
                $('#preview_volume').val(settings['preview_volume']);
                console.log('preview_volume set to', 10);
            });
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


