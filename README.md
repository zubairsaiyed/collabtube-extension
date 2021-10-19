## TODO
* Create add form field to update SESSION_ID in pop_up.html
** Pop_up.js should pass the SESSION_ID to background.js
* content.js should pass video id to background.js
* background.js should pass video id from content page to websocket including the SESSION_ID (error if not set)
* server should create a mapping of session id to list of video ids for each new session id received
* server should support:
** add video to session id
** remove video from session id
** clear session id