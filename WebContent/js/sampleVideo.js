// url params
window.params = {};
window.params.quota = {};
window.ndvrItems = {allItems:[]};
window.catchup = {};
window.catchupChannels =[];
window.catchupHash = undefined;
window.config;
window.tv_ratings = [];
window.indexPrograms = 0;
window.indexChannels = 0;
window.refreshInterval = undefined;
window.refreshIntervalCatchup = undefined;
window.intervalKeepAlive = undefined;
window.activePlaybackSession = {};
window.favorites = [];
window.poster = undefined;
window.jsonCounter = 0;
window.scheduleOption_keep_index = 0;
window.scheduleOption_startOffset_index = 0;
window.scheduleOption_endOffset_index = 0;
window.scheduleOptionFlag = false;
window.keepAliveFixedValue = false;
//window.ajaxFlag = true;

window.timeline;

$(function() {
	getQueryParams();
	responsiveRender();
    showPigVideo();
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

function responsiveRender() {
  window.addEventListener('orientationchange', function(){
  event.preventDefault();});
  window.params.responsiveStyles = {};
  var width, height;
  if(window.device.isIOS()){
    width = screen.heght;
    height = screen.width;
  } else{
    width = screen.width;
    height = window.screen.availHeight;
  }
  window.params.responsiveStyles.header = height * 0.05;
  window.params.responsiveStyles.info_height = height * 0.3;
  window.params.responsiveStyles.grid_height = height * 0.62;

  $('.rogers-header').attr('style', 'height:' + window.params.responsiveStyles.header + 'px !important;');
  $('.container').attr('style', 'height:' + window.params.responsiveStyles.info_height + 'px !important;');
  $('#channelEntry').attr('style', 'height:' + window.params.responsiveStyles.info_height + 'px !important; ' + 'float: left; width: 100%; position: absolute;');
  $('.container_grid').attr('style', 'height:' + window.params.responsiveStyles.grid_height + 'px !important;');

  $('.title').attr('style', 'font-size:' + window.params.responsiveStyles.header * 0.45 + 'px !important;');
  $('.imgStatus').attr('style', 'height:' + window.params.responsiveStyles.header * 0.45 + 'px !important;');
  $('.posterTitle').attr('style', 'height:' + window.params.responsiveStyles.info_height + 'px !important;');

  $('.posterTitleContainer').attr('style', 'height:' + window.params.responsiveStyles.info_height + 'px !important; width:' + (window.params.responsiveStyles.info_height *0.75) +  'px !important;');

  var widthMyRecording = "margin-right:" + (width*0.015) + 'px !important;';
  var myRecordingLink =  $('.myRecordingContent')
  myRecordingLink.find('img').attr('style', 'height:' + window.params.responsiveStyles.header * 0.7 + 'px !important;');
  myRecordingLink.attr('style', widthMyRecording);
}


function showPigVideo(){
  $('#contentVideo').show();
}

function hidePigVideo(){
  if(videojs.players.video_stream){
     videojs.players.video_stream.dispose();
     clearTimeout(intervalKeepAlive);
	 var payload = {};
	 payload.status = "FINISHED";
	 payload.offset = window.activePlaybackSession.timeElapsed;
	 var sessionId = window.activePlaybackSession.sessionId;
	 var recordingId = window.activePlaybackSession.subscriberRecordingId;
	 sendKeepAlive(sessionId, recordingId, payload);
	 window.activePlaybackSession = {};
	 window.programSelected = undefined;
  }

  $('#contentVideo').hide();
}

function playVideo(videoUrl) {
  //videoUrl = "http://10.26.68.107:18084/C36602B9-6BD0-4205-B0D6-3AE85A0E5BA9.m3u8";
	videoUrl = "http://10.184.12.10/jitp.lowell.ndvrlabs.com:18082/7177434b91de455c828a7d4829605f11.m3u8";
  var options;
  if(window.device.isIOS()){
    options = {
        'controls': true,
        'autoplay': true,
        'preload': 'auto',
        'techOrder': ['html5']
      };
  }else{
    options = {
        'controls': true,
        'autoplay': true,
        'preload': 'auto',
        'techOrder': ['flash']
      };

  }
  $('#contentVideo.right').attr('style', 'height:' + window.params.responsiveStyles.info_height + 'px !important; display: block;');
  // initialize the player
  var video = document.getElementById('video_stream');
  if(!video){
    video = document.createElement("video");
    video.className = "video-js vjs-default-skin";
    video.id = 'video_stream';
    video.setAttribute('width','100%');
    video.setAttribute('height','100%');
    $('#contentVideo').prepend(video);
  }



  videojs('video_stream', options, function() {
    this.src({
      type: 'video/mp4',
      src: videoUrl
    });
  });
}
/*
* END VIDEO JS
*/
