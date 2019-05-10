$(document).ready(function() {
    // displayCoverArt();
});

function displayCoverArt() {
    checkRefresh()
        .then(function(result){
            console.log('Result', result)
        }, function(err){
            console.log('Error', err);
            if (err === 'Refresh Required') {
                api_getTracks()
                    .then(function(result){
                        console.log('Result', result)
                    }, function(err){
                        console.log('Error', err)
                    })
            } else {
                // Set Refresh in a week
                let refreshDate = moment().add(7, 'd');
                setRefresh(refreshDate);
                console.log('Refresh not found, set to ' + refreshDate.format("dddd, MMMM Do YYYY, h:mm:ss a"))
            }
        })
}

function checkRefresh() {
    return new Promise(function (resolve, reject) {
        let key = 'refresh';
        chrome.storage.sync.get([key], result => {
            if (key in result) {
                if (result[key] > moment().valueOf()) {
                    resolve('Refresh is set to ' + moment(result[key]).format("dddd, MMMM Do YYYY, h:mm:ss a"));
                } else {
                    reject('Refresh Required');
                }
            } else {
                reject('Refresh not found')
            }
        });
    });
}

function setRefresh(refreshDate) {
    chrome.storage.sync.set({refresh: refreshDate.valueOf()}, function() {
        console.log('Refresh is set to ' + refreshDate.format("dddd, MMMM Do YYYY, h:mm:ss a"));
    });
}