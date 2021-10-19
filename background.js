console.log("test");
createWebSocketConnection();

var websocket;
var sessionId = "default_session";
var queue = [];
function createWebSocketConnection() {

    if ('WebSocket' in window) {
        var socket_protocol = 'ws';
        if (window.location.protocol == 'https:') {
            socket_protocol = 'wss';
        }
        var host = `${socket_protocol}://localhost:3000`;
        try {
            websocket = new WebSocket(host);
        } catch {
            console.log("failed to connect to backend, trying again in 1 sec")
            // setTimeout(createWebSocketConnection(), 1000);
        }
        console.log("======== websocket ===========", websocket);

        // websocket.onping = function() {
        //     console.log("pingged");
        //     heartbeat(websocket);
        // }

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
                    break;
                case "clear_queue":
                    queue = [];
                    console.log("cleared queue");
                    break;
                case "update_queues":
                    if (sessionId in msg.queues) {
                        queue = msg.queues[sessionId];
                    }
                    console.log(queue);
                    break;
                default:
                    var notificationOptions = {
                        type: "basic",
                        title: msg.title,
                        message: msg.message,
                        iconUrl: "icon.png"
                    }
                    chrome.notifications.create("", notificationOptions);
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
                break;
            case "refresh_queue":
                var data = { "action": "refresh_queue", "queue": queue};
                sendResponse(JSON.stringify(data));
                console.log("refreshing queue: " + queue);
                break;
            case "clear_queue":
                var data = { "action": "clear_queue" };
                websocket.send(JSON.stringify(data));
                console.log("clearing queue for session");
                break;
            case "request_next_video":
                requestNextVideo();
                break;
            case "pop_video":
                var video_link = request.video_link;
                console.log("popping video " + video_link + " from session");
                var data = { "action": "next_video", "video_link": queue.length > 0 ? queue[0] : 'dQw4w9WgXcQ'};
                sendResponse(JSON.stringify(data));
                var data = { "action": "pop_video", "video_link": video_link };
                websocket.send(JSON.stringify(data));
                break;
            case "append_video":
                var video_link = request.video_link;
                console.log("append video " + video_link + " to session ");
                var data = { "action": "append_video", "video_link": video_link };
                websocket.send(JSON.stringify(data));
                break;
            default:
        }
    }
);


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

// function heartbeat(ws) {
//     console.log("heartbeat... resetting timeout");
//     clearTimeout(ws.pingTimeout);

//     // Use `WebSocket#terminate()`, which immediately destroys the connection,
//     // instead of `WebSocket#close()`, which waits for the close timer.
//     // Delay should be equal to the interval at which your server
//     // sends out pings plus a conservative assumption of the latency.
//     ws.pingTimeout = setTimeout(() => {
//         console.log("client side timeout");
//         ws.close();
//     }, 5000 + 1000);
// }