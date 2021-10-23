
// INITIALIZATION

document.onreadystatechange = function () {
    console.log(document.readyState);
    switch (document.readyState) {
        case 'loading':
            break;
        case 'interactive':
            tryFullscreen();
            break;
        case 'complete':
            // VIDEO PLAYER OBSERVER
            playerNode = document.getElementsByClassName('html5-video-player')[0];
            mutationObserver = new MutationObserver(callback)
            mutationObserver.observe(playerNode, {
                attributes: true,
                attributeFilter: ['class'],
                attributeOldValue: true,
            })

            // DRAGBOX
            drag_box = document.createElement('div');
            drag_box.id = "queueBox";
            drag_box.ondrop = queueBoxOnDrop;
            drag_box.ondragover = allowDrop;
            drag_box.style.cssText = 'position:fixed;bottom:20px;right:20px;width:50px;height:50px;border-radius:25px;background-color:red    ';
            if (document.fullscreenElement === null) {
                document.body.appendChild(drag_box);
            }

            break;
        default:
            break;
    }
  }


// MUTATION OBSERVER

function callback(mutationsList) {
    mutationsList.every(mutation => {
        if (mutation.oldValue.includes('playing-mode') && playerNode.classList.contains('ended-mode')) {
            requestNextVideo();
            return false;
        }
    })
}

// VIDEO CONTROLLER

function requestNextVideo() {
  chrome.runtime.sendMessage({type: "request_next_video"}, function(response) {
    console.log("requesting next video");
  });
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
      console.log(request);
      if (request.action === "nextVideo") {
        playNextVideo(request.video_link);
        sendResponse(JSON.stringify({ "action": "ack"}));
      }
    }
  );

function playNextVideo(video_link) {
    console.log("playing next video");
    nextVideo = video_link;
    if (nextVideo.startsWith("http"))
        nextVideo = extractVideoId(nextVideo);
    window.location.href = `watch?v=${nextVideo}`;
}

function extractVideoId(videoURL) {
    return videoURL.split("=")[1];
}


// DRAG AND DROP VIDEOS INTO QUEUE

var drag_box;

function allowDrop(ev) {
ev.preventDefault();
}
  
function queueBoxOnDrop(event) {
    event.preventDefault();
    var tmp = document.createElement("div");
    tmp.innerHTML = event.dataTransfer.getData("text/html");
    var link = tmp.getElementsByTagName("a")[0];
    chrome.runtime.sendMessage({type: "append_video", video_link: normalizeVideoLink(link.href)}, function(response) {
        console.log("appended video from drag&drop");
    });
}


// AUTO-FULLSCREEN

document.onfullscreenchange = function(event) {
    fullscreenchange();
}

function fullscreenchange() {
    if (document.body == null) {
        return;
    }
    console.log("FULL SCREEN CHANGE")
    if (document.fullscreenElement === null) {
        document.body.appendChild(drag_box);
    } else {
        document.body.removeChild(drag_box);
    }
  };

document.onfullscreenerror = function ( event ) {
    console.log("Unable to switch into full-screen mode.");
    // this.location.reload();
};

function tryFullscreen() {
    if (document.fullscreenElement === null) {
        document.documentElement.requestFullscreen();
    }
}