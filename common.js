
// function setQueue(queue) {
//     value = JSON.stringify(queue);
//     chrome.storage.sync.set({queue: value}, function() {
//         console.log('Value is set to ' + value);
//       });
// }

// function getQueue() {
//     var queue;
//     chrome.storage.sync.get(['queue'], function(result) {
//           queue = result.queue;
//           console.log('Value currently is ' + queue);
//           console.log(typeof(queue));
//     });
//     if (queue === undefined) {
//         return [];
//     }
//     return JSON.parse(queue);
// }

// function appendToQueue(item) {
//     queue.push(item);
//     setQueue(queue);
// }

// var queue = getQueue();

// chrome.storage.onChanged.addListener((changes, area) => {
//     if (area === 'sync' && changes.queue?.newValue) {
//         queue = JSON.parse(changes.queue.newValue);
//         console.log('Value currently is ' + queue);
//     }
//   });


function normalizeVideoLink(video_link) {
    let url;
    
    try {
        url = new URL(video_link);
    } catch (_) {
        return video_link;
        // return false;  
    }
    
    // return url.protocol === "http:" || url.protocol === "https:";
    return url.searchParams.get("v");
}