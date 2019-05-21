$('.link').click(function (e) {
    window.open($(e.target).attr('href'));
});

$(document).ready(function() {
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
                }
            })
        }
    });
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
        });
    });
});


