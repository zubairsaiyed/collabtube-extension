
var websocket;
var sessionId = "global";
var queue = [];
var host = 'wss://collabtube.herokuapp.com/';
createWebSocketConnection();

function createWebSocketConnection() {

    if ('WebSocket' in window) {
        try {
            websocket = new WebSocket(host);
        } catch {
            console.log("failed to connect to backend, trying again in 1 sec")
        }
        console.log("======== websocket ===========", websocket);

        websocket.onopen = function () {
            // heartbeat(websocket);
            var data = { "action": "set_session", "session_id": sessionId };
            websocket.send(JSON.stringify(data));
        };

        websocket.onclose = function clear() {
            clearTimeout(websocket.pingTimeout);
        };

        websocket.onmessage = function (event) {
            console.log(event.data);
            var msg = JSON.parse(event.data);
            switch (msg.action) {
                case "request_next_video":
                    requestNextVideo();
                    break;
                case "append_video":
                    video_link = msg.video_link;
                    console.log("appending video: " + video_link);
                    queue.push(video_link);
                    updatePopUp();
                    break;
                case "pop_video":
                    video_link = msg.video_link;
                    console.log("popping video: " + video_link)
                    if (queue.length > 0 && queue[0] == video_link) {
                        queue.shift();
                        console.log("popped video: " + video_link);
                    } else {
                        console.log("WARNING: video " + video_link + " is not at the top of the queue");
                    }
                    updatePopUp();
                    break;
                case "clear_queue":
                    queue = [];
                    console.log("cleared queue");
                    updatePopUp();
                    break;
                case "update_queue":
                    queue = msg.queue;
                    updatePopUp();
                    break;
                default:
                    console.log("unrecognized web socket message")
                    break;
            }
            console.log(queue);
        };

        websocket.onclose = function () {
            console.log("==== web socket closed ======");
            console.log("attempting to reconnect");
            createWebSocketConnection();
        };
    }
};

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        switch (request.type) {
            case "update_queues":
                break;
            case "set_session":
                sessionId = request.sessionId;
                var data = { "action": "set_session", "session_id": sessionId };
                websocket.send(JSON.stringify(data));
                console.log("set session id: " + sessionId);
                sendResponse(JSON.stringify({ "action": "ack"}));
                break;
            case "refresh_popup":
                updatePopUp();
                sendResponse(JSON.stringify({ "action": "ack"}));
                break;
            case "clear_queue":
                var data = { "action": "clear_queue" };
                websocket.send(JSON.stringify(data));
                console.log("clearing queue for session");
                break;
            case "request_next_video":
                requestNextVideo();
                sendResponse(JSON.stringify({ "action": "ack"}));
                break;
            case "pop_video":
                var video_link = request.video_link;
                console.log("popping video " + video_link + " from session");
                var data = { "action": "next_video", "video_link": queue.length > 0 ? queue[0] : 'dQw4w9WgXcQ'};
                sendResponse(JSON.stringify(data));
                var data = { "action": "pop_video", "video_link": video_link };
                websocket.send(JSON.stringify(data));
                updatePopUp();
                break;
            case "append_video":
                var video_link = request.video_link;
                console.log("append video " + video_link + " to session ");
                var data = { "action": "append_video", "video_link": video_link };
                websocket.send(JSON.stringify(data));
                updatePopUp();
                sendResponse(JSON.stringify({ "action": "ack"}));
                break;
            default:
        }
    }
);

function updatePopUp() {
    chrome.runtime.sendMessage({
        msg: "update_popup", 
        queue: queue,
        session_id: sessionId
    });
}

function requestNextVideo() {
    if (queue.length == 0) {
        console.log("no videos remaining in queue")
        return;
    }
    console.log("sending nxt video");
    var video_link = queue[0];
    // ask content page to play next video
    chrome.tabs.query({ active: true, url: "https://*.youtube.com/watch*" }, function (tabs) {
        console.log("tabs: " + tabs);
        chrome.tabs.sendMessage(tabs[0].id, { action: "nextVideo" , video_link: video_link}, function (response) {
            console.log("requested tab to play next video");
        }); 
    });

    // broadcast pop
    console.log("popping video " + video_link + " from session ");
    var data = { "action": "pop_video", "video_link": video_link };
    websocket.send(JSON.stringify(data));
    console.log("clearing queue for session");
}

// When the extension is installed or upgraded ...
chrome.runtime.onInstalled.addListener(function() {
    // Replace all rules ...
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      // With a new rule ...
      chrome.declarativeContent.onPageChanged.addRules([
        {
          // That fires when a page's URL contains a 'g' ...
          conditions: [
            new chrome.declarativeContent.PageStateMatcher({
              pageUrl: {  hostEquals: 'www.youtube.com' },
            })
          ],
          // And shows the extension's page action.
          actions: [ new chrome.declarativeContent.ShowPageAction() ]
        }
      ]);
    });
  });