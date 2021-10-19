chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
      if (request.greeting === "hello")
        sendResponse({farewell: "goodbye"});
      if (request.msg === "update_popup") {
        queue = request.queue;
        console.log("updated queue: " + queue);
        document.getElementById('queue').innerHTML = queue;
        document.getElementById("session_header").innerHTML = request.session_id;
      }
    }
  );

document.addEventListener("DOMContentLoaded", function(event){
    document.getElementById("reloadQueue").addEventListener("click", function() {
      requestUpdate();
    });

    document.getElementById("setSessionId").addEventListener("click", function() {
        var session_id = document.getElementById("sessionId").value;
        if (session_id.trim() == "") return;
        document.getElementById("sessionId").value = "";
        submitSessionId(session_id);
    });
    document.getElementById("enqueueVideo").addEventListener("click", function() {
        var new_video_id = document.getElementById("newVideoId").value;
        if (new_video_id.trim() == "") return;
        document.getElementById("newVideoId").value = "";
        enqueueVideo(normalizeVideoLink(new_video_id));
    });
    document.getElementById("nextVideo").addEventListener("click", function() {
        requestNextVideo();
        requestUpdate();
    });
    document.getElementById("clearQueue").addEventListener("click", function() {
        clearQueue();
    });
});

function submitSessionId(session_id) {
  chrome.runtime.sendMessage({type: "set_session", sessionId: session_id}, function(response) {
    console.log("submitted session id");
    requestUpdate();
  });
}

function clearQueue() {
  chrome.runtime.sendMessage({type: "clear_queue"}, function(response) {
    console.log("clearing queue");
  });
}

function requestNextVideo() {
  chrome.runtime.sendMessage({type: "request_next_video"}, function(response) {
    console.log("requesting next video");
  });
}


function enqueueVideo(videoId) {
  chrome.runtime.sendMessage({type: "append_video", video_link: videoId}, function(response) {
    console.log("appended video: " + videoId);
  });
}

function nextVideo() {
  // send message to content script to play next video
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.log(tabs);
    chrome.tabs.sendMessage(tabs[0].id, {type: "request_next_video"}, function(response) {
      console.log("requesting bg to play next video");
    });
  });
}

// chrome.storage.onChanged.addListener((changes, area) => {
//     if (area === 'sync' && changes.queue?.newValue) {
//         document.getElementById('queue').innerHTML = queue;
//     }
//   });

function requestUpdate() {
    chrome.runtime.sendMessage({type: "refresh_popup"}, function(response) {
      console.log("requested popup update")
    });
}

window.onload = function() {
  //popup was opened, do what you want
  document.body.append(`Updated at ${new Date().toLocaleTimeString()}`);
  requestUpdate();
};