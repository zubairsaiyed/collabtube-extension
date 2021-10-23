function normalizeVideoLink(video_link) {
    let url;
    
    try {
        url = new URL(video_link);
    } catch (_) {
        return video_link;
        // return false;  
    }
    
    return url.searchParams.get("v");
}