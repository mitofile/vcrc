// url params
window.params = {};


$(function() {
	getQueryParams();
    var url = window.params.videoUrl;
    playVideo(url);	
	//playVideo("http://10.26.68.107:18084/C36602B9-6BD0-4205-B0D6-3AE85A0E5BA9.m3u8");
});


function getQueryParams() {
	  if (location.search) {
	    var parts = location.search.substring(1).split('&');
	    for (var i = 0; i < parts.length; ++i) {
	      var nv = parts[i].split('=');
	      if (!nv[0]) {
	        continue;
	      }
	      window.params[nv[0]] = nv[1] || true;
	    }
	  }
	}

function playVideo(videoUrl) {
  //videoUrl = "http://10.26.68.107:18084/C36602B9-6BD0-4205-B0D6-3AE85A0E5BA9.m3u8";
  var options = {
	        'controls': true,
	        'autoplay': true,
	        'preload': 'auto'
	      };

  $('#contentVideo.right').attr('style', 'height:' + 200 + 'px !important; display: block;');
  // initialize the player
  var video = document.getElementById('video');
  if(!video){
    video = document.createElement("video");
    video.id = 'video';
    video.className = "video-js vjs-default-skin";
    video.setAttribute('width','600');
    video.setAttribute('height','300');
    $('#contentVideo').prepend(video);
  }



  var player = videojs('video', options, function() {
    this.src({
      type: 'application/x-mpegURL',
      src: videoUrl
    });
  });
  
  window.params.player = player;
}
/*
* END VIDEO JS
*/
