var allItemsPR = [];
var allItemsSR = [];
var allItemsDEL = [];

var oldAllItemsPR;
var oldAllItemsTS;
var oldAllItemsSR;
var oldAllItemsDEL;

var catchuptvHash;
var recordingsHash;
var schedulesHash;

window.activePlaybackSession = {};

window.scheduleOption_keep_index = 0;
window.scheduleOption_startOffset_index = 0;
window.scheduleOption_endOffset_index = 0;
window.scheduleOption_accept_index = 0;
window.jsonCounter = 0;
window.params = {};
window.catchup = {};
window.catchupFiltered = {}

var currentItems = undefined;
var allItems = [];
var assetInfo = undefined;
var lastFocused = undefined;
var lastFocusedMainPage = undefined;
var videoPlayerControls = undefined;
var isFullScreenPosters = false;
var intervalKeepAlive = undefined;
var intervalRefresh = undefined;
var intervalRefreshCatchUp = undefined;
var intervalRefreshDeleted = undefined;
var isRefresh_SR_PR = undefined;
var isRefresh_TSR = undefined;
var isRefresh_Deleted = undefined;
var pendingRefresh = undefined;
var pendingRefreshCatchUp = undefined;
var pendingRefreshDeleted = undefined;
var renderItem;
var lastSelectedIdBefRefresh = undefined;
var playInterval = false;
var progress = undefined;
var createInfoMenuItems;
var recordingConfig;
var refreshMainPage;
var config = undefined;
var config_tv_ratings = undefined;
var currClass;
var iconTimeOut;
var subscriberParam;
var playerKeyEvents;
var playerEndPlaybackEvent;
var leftNavFocusPosition;
var lastNavFocusPosition;
var loadItems;
// for logging only
var logger;
var loggingOptions;

var cleanNdvrDateStart = undefined;
var pin = undefined;
var pressedKey = "";

var funcClearNdvr = function(e) {
	var val;
	switch (e.which) {
	case MWU.REMOTEKEY.ZERO:
		val = 0;
		break;
	case MWU.REMOTEKEY.ONE:
		val = 1;
		break;
	case MWU.REMOTEKEY.TWO:
		val = 2;
		break;
	case MWU.REMOTEKEY.THREE:
		val = 3;
		break;
	case MWU.REMOTEKEY.FOUR:
		val = 4;
		break;
	case MWU.REMOTEKEY.FIVE:
		val = 5;
		break;
	case MWU.REMOTEKEY.SIX:
		val = 6;
		break;
	case MWU.REMOTEKEY.SEVEN:
		val = 7;
		break;
	case MWU.REMOTEKEY.EIGHT:
		val = 8;
		break;
	case MWU.REMOTEKEY.NINE:
		val = 9;
		break;
	default:
		e.preventDefault();
		break;

	}
	if (e.which >= 48 && e.which <= 57) {
		if (!cleanNdvrDateStart) {
			cleanNdvrDateStart = new Date();
			pressedKey += val + "";
		} else {
			var now = new Date();
			if (((now - cleanNdvrDateStart) / 1000) <= 2) {
				pressedKey += val + "";
				if (pin === pressedKey) {
					// call Action clean
					pressedKey = "";
					var r = confirm("If you press OK all recordings and schedules will be deleted from STB and nDVR");
					if (r == true) {
						sendSyncMoxiNdvr(function() {
							isRefresh_SR_PR = true;
							refreshMainPage();
						});
					}
				}
			} else {
				pressedKey = val + "";
			}
			cleanNdvrDateStart = now;
		}
	}

};

function getSubscriberRecOption() {
	// Test Monitor
	var msgObj = {};
	msgObj.className = "dataMonitorMsg";
	msgObj.msg = "Getting default Options for subscriber: " + subscriberParam;
	reportActivity(msgObj);
	// Test Monitor------------------------------
	var deferred = subscriberPreferences(subscriberParam, false);
	$
			.when(deferred)
			.done(
					function(data) {
						if ((data && data.ERROR)) {
							informErrorActivity(data);
							window.scheduleOption_startOffset_index = 0;
							window.scheduleOption_endOffset_index = 0;
							window.scheduleOption_keep_index = 0;
							window.scheduleOption_accept_index = 0;
						} else {
							informSuccessActivity(data);
							if (data.startOffset) {
								window.scheduleOption_startOffset_index = _
										.indexOf(
												window.configGuide.ScheduleOptions[0].internalValues,
												data.startOffset);
							} else {
								window.scheduleOption_startOffset_index = 0;
							}
							if (data.endOffset) {
								window.scheduleOption_endOffset_index = _
										.indexOf(
												window.configGuide.ScheduleOptions[1].internalValues,
												data.endOffset);
							} else {
								window.scheduleOption_endOffset_index = 0;
							}
							if (data.spaceConflictPolicy) {
								window.scheduleOption_keep_index = _
										.indexOf(
												window.configGuide.ScheduleOptions[2].internalValues,
												data.spaceConflictPolicy);
							} else {
								window.scheduleOption_keep_index = 0;
							}
							if (data.accept) {
								window.scheduleOption_accept_index = _
										.indexOf(
												window.configGuide.ScheduleOptions[3].internalValues,
												data.accept);
							} else {
								window.scheduleOption_accept_index = 0;
							}
						}
					});
};

function getOptions() {
	var options = {};
	options.spaceConflictPolicy = configGuide.ScheduleOptions[2].internalValues[window.scheduleOption_keep_index];
	options.startOffset = configGuide.ScheduleOptions[0].internalValues[window.scheduleOption_startOffset_index];
	options.endOffset = configGuide.ScheduleOptions[1].internalValues[window.scheduleOption_endOffset_index];
	options.accept = configGuide.ScheduleOptions[3].internalValues[window.scheduleOption_accept_index];
	return options;
};

function sendSubscriberOptions() {
	var options = getOptions();
	// Test Monitor
	var msgObj = {};
	msgObj.className = "dataMonitorMsg";
	msgObj.msg = "Updating Default Options for Subscriber: " + subscriberParam;
	reportActivity(msgObj);
	// Test Monitor------------------------------
	var deferred = saveSubPreferences(subscriberParam, options);
	$.when(deferred).done(function(data) {
		if (data && data.ERROR) {
			informErrorActivity(data);
		} else {
			informSuccessActivity(data);
		}
	});
};

function addNdvrClearKeyPIN() {
	document.addEventListener('keydown', funcClearNdvr, false);
}
function removeNdvrClearKeyPIN() {
	document.removeEventListener('keydown', funcClearNdvr);
}

addNdvrClearKeyPIN();

function VideoPlayerControls() {
	this.isPlaying = false;
	this.isVisible = false;
	this.isVisibleMediaVideo = false;
	this.currentTime = 0;
	this.totalTime = 0;
	this.bufferTime = 0;
	this.video_url = "";
	this.hide_timeOut = 700;
	this.content = undefined;
	this.buffer_interval_check = undefined;
	this.buffer_seconds = 10;
	this.asset_duration_program_sec = 0;
	this.asset_duration_playback_sec = 0;
	this.asset_offset_playback_duration_sec = 0;
	this.asset_offset_playback_bar_sec = 0;
	this.asset_offset_playback_moxi = 0;
	this.sec_offset = 0;
	this.test_duration_sec = 240;
}

VideoPlayerControls.prototype.init = function(content, url) {
	this.content = content;
	this.video_url = url;
};

VideoPlayerControls.prototype.hideVideo = function() {
	var videoplayer = $('#videoStream');
	if (videoplayer.length > 0) {
		videoplayer.pause();
		this.content.hide();
	}
	lastFocused.click();
	$('#videoContainer').hide();
	$('#infoNdvrPage').show();
};

function infoScreenSelect() {
	if (assetInfo.content_type && assetInfo.content_type === "episode"
			|| assetInfo.content_type === "SubscriberSeriesRecording") {
		$('#infoNdvrPage').hide();
		$('#collectionLabel').html("EPISODES");
		$('#infoSeriesNdvrPage').show();
		$('#infoListOptions').empty();
		if ($('#episodeList .active')) {
			$('#episodeList .active').click();
		}
	} else {
		$('#infoSeriesNdvrPage').hide();
		$('#infoNdvrPage').show();
	}
}

function backCatchupProgScreen(){
	assetInfo = recordingSetSelected;
	$('#infoNdvrPage').hide();
	$('#collectionLabel').html("PROGRAMS");
	$('#infoSeriesNdvrPage').show();
	$('#infoListOptions').empty();
	if ($('#episodeList .active')) {
		$('#episodeList .active').click();
	}
}

function getCurrenticonClass() {
	var iconClass = $("#status_icon").attr('class');
	if (iconClass !== 'fast_forward' && iconClass !== 'rewind') {
		currClass = iconClass;
		return currClass;
	}
}

VideoPlayerControls.prototype.trickPlay = function(mediaPlayer, f) {

	var that = this;

	var currentTime = mediaPlayer.currentTime;
	var secs = 60 * f;
	var timeStep = Math.floor(currentTime + secs);

	function trickPlayAction(duration, isCapturing, offset) {
		var min_sec, max_sec;
		min_sec = offset;
		if (isCapturing) {
			if (duration > that.asset_duration_playback_sec) {
				max_sec = that.asset_duration_playback_sec;
			} else {
				max_sec = duration;
			}

		} else {
			max_sec = that.asset_offset_playback_moxi
					+ that.asset_duration_playback_sec;
			if (max_sec > duration) {
				max_sec = duration;
			}
		}

		if (f > 0) {
			// fast-foward
			if (timeStep && timeStep < max_sec) {
				mediaPlayer.currentTime = that.getOffsetRate(timeStep);
				duration = undefined;
			}

		} else {
			// rewind
			if (timeStep && timeStep > min_sec) {
				mediaPlayer.currentTime = that.getOffsetRate(timeStep);
				duration = undefined;
			}
			if (timeStep && timeStep < that.asset_offset_playback_moxi) {
				mediaPlayer.currentTime = that.asset_offset_playback_duration_sec
						- that.sec_offset;
				duration = undefined;
			}
		}

	}

	if (assetInfo.status != 'CAPTURING') {

		var duration = mediaPlayer.duration;
		trickPlayAction(duration, false,
				that.asset_offset_playback_duration_sec);

	} else {
		var duration = mediaPlayer.duration;
		trickPlayAction(duration, true, that.asset_offset_playback_duration_sec);
	}

	// USED ONLY TO RESTORE THE CORRECT PLAYER ICON
	clearTimeout(iconTimeOut);
	iconTimeOut = setTimeout(function() {

		$("#status_icon").removeClass().addClass(currClass);

	}, 100);

};

VideoPlayerControls.prototype.playVideo = function() {

	// removes all the keynavigation attributes
	$('#infoListOptions').empty();

	playerEndPlaybackEvent = function(e) {
		that.back();
	};

	backFromVideo = function() {
		if (videojs.players.video_stream) {
			videojs.players.video_stream.dispose();
		}
		$('#video_stream').remove();
		// clearTimeout(intervalKeepAlive);
		intervalKeepAlive = undefined;

		$('#mainNdvrPage').hide();
		$('#videoStream').hide();
		$('#videoContainer').hide();
		$('#videoContent').hide();
		$('#infoNdvrPage').show();

		createInfoMenuItems();

		if (!jQuery.browser.mobile) {
			lastFocused.click();
		}

		document.removeEventListener('keyup', playerKeyEvents);

	};

	playerKeyEvents = function(e) {
		var that = this;
		// if (that.content.is(':visible')) {
		switch (e.which) {
		// case MWU.REMOTEKEY.WINDOWKEY_PLAY: // play
		// var src = videoPlayer.getAttribute('src');
		// if(src === '') {
		// that.playVideo();
		// }
		// that.showPlayerControls("play");
		// break;
		//
		// case MWU.REMOTEKEY.WINDOWKEY_PAUSE: // pause
		// that.showPlayerControls("pause");
		// break;
		//
		// case MWU.REMOTEKEY.WINDOWKEY_STOP: // stop
		// that.showPlayerControls("stop");
		// that.back();
		// break;
		//
		// case MWU.REMOTEKEY.WINDOWKEY_REWIND: // rewind
		// getCurrenticonClass();
		// that.showPlayerControls("rewind");
		// that.trickPlay(videoPlayer, -1);
		// break;
		//
		// case MWU.REMOTEKEY.WINDOWKEY_FF: // fast forward
		// getCurrenticonClass();
		// that.showPlayerControls("fast_forward");
		// that.trickPlay(videoPlayer, 1);
		// break;

		// case 66:
		case MWU.REMOTEKEY.BACK:
			backFromVideo();
			break;
		}

		// }

	};

	durationChangeEvent = function(e) {

	};

	document.addEventListener('keyup', playerKeyEvents, false);

	// video.attr("src", this.video_url);
	$('#infoNdvrPage').hide();
	$('#videoContainer').show();
	this.content.show();
	// video.load();

	 options = {
		        'controls': true,
		        'autoplay': true,
		        'preload': 'auto'
    };
	// initialize the player
	var video = document.getElementById('video_stream');
	if (!video) {
		video = document.createElement("video");
		video.className = "video-js vjs-default-skin";
		video.id = 'video_stream';
		video.setAttribute('width', '100%');
		video.setAttribute('height', '100%');
		$('#videoContent').prepend(video);
	}
	var videoUrl = this.video_url;
	window.params.player = videojs('video_stream', options, function() {
		this.src({
			type : 'application/x-mpegURL',
			src : videoUrl
		});
	});

	window.params.player.on("loadedmetadata", setPlayerPosition);
	
	  window.params.player.on("pause", function(event){
	      event.preventDefault();
	      var currentOffset = Math.floor(window.params.player.currentTime());
	      if(window.activePlaybackSession.type != CONSTANTS.CATCHUP_TV_TYPE){
	    	  notifyTrickPlayEvent(CONSTANTS.TRICK_PLAY_EVENT_PAUSE, window.activePlaybackSession, currentOffset);
	      }
	  });

	

	if (!jQuery.browser.mobile) {
		video.click();
	}

	$("a#status_icon").on("click", function(ev) {
		ev.preventDefault();
	});

	// video[0].addEventListener('ended', playerEndPlaybackEvent, false);

};

VideoPlayerControls.prototype.myAutoPlay = function(videoStrem) {
	videoStrem.play();
	this.showPlayerControls("play");
};

VideoPlayerControls.prototype.setPlaybackData = function(videoStream) {
	this.asset_duration_program_sec = assetInfo.duration_program.hours * 60
			* 60 + assetInfo.duration_program.min * 60
			+ assetInfo.duration_program.sec;
	this.asset_duration_playback_sec = assetInfo.duration_playback.hours * 60
			* 60 + assetInfo.duration_playback.min * 60
			+ assetInfo.duration_playback.sec;
	// this.asset_offset_playback_duration_sec =
	// assetInfo.offset_playback_duration.hours * 60 * 60 +
	// assetInfo.offset_playback_duration.min * 60 +
	// assetInfo.offset_playback_duration.sec;
	this.asset_offset_playback_bar_sec = assetInfo.offset_playback_bar.hours
			* 60 * 60 + assetInfo.offset_playback_bar.min * 60
			+ assetInfo.offset_playback_bar.sec;
};

VideoPlayerControls.prototype.getOffsetRate = function(newTime) {
	// var fac = 0.7;
	// var sec_time = newTime/ 60;
	// var b = sec_time * fac;
	// return Math.floor(newTime - b);
	return Math.floor(newTime);
};

VideoPlayerControls.prototype.checkOffsetPositionPlayback = function(
		videoStream) {
	var that = this;
	// if (this.asset_offset_playback_duration_sec > 0) {
	// var fac = 0.7;
	// var sec_time = this.asset_offset_playback_duration_sec / 60;
	// var b = sec_time * fac;
	// this.sec_offset = b;
	// videoStream.currentTime =
	// Math.floor(this.asset_offset_playback_duration_sec - b);
	// this.intervalChangeDuration = setInterval(function() {
	// if (videoStream.currentTime !=
	// Math.floor(that.asset_offset_playback_duration_sec - b)) {
	// that.asset_offset_playback_moxi = videoStream.currentTime;
	// clearTimeout(that.intervalChangeDuration);
	// that.m_playerTimer = window.setInterval(function() {
	// that.playerControls(videoStream);
	// }, 300);
	// }
	//
	// }, 100);
	// } else {
	that.m_playerTimer = window.setInterval(function() {
		that.playerControls(videoStream);
	}, 300);
	// }
};

VideoPlayerControls.prototype.bufferIntervalCheck = function(videoStream) {

	var that = this;

	if (videoStream.buffered.end(videoStream) >= this.buffer_seconds) {
		this.setPlaybackData(videoStream);
		that.myAutoPlay(videoStream);
		this.inter = setInterval(function() {
			if (videoStream.currentTime > 0) {
				clearTimeout(that.inter);
				that.checkOffsetPositionPlayback(videoStream);
			}
		}, 50);

		window.clearTimeout(this.buffer_interval_check);
		$('.loadingContent').hide();
	}

};

VideoPlayerControls.prototype.stopVideo = function() {
	// clearTimeout(intervalKeepAlive);
	if (this.m_playerTimer) {
		window.clearTimeout(this.m_playerTimer);
	}
	window.clearTimeout(this.buffer_interval_check);

	$.each(this.content.children().filter("video"), function(i, item) {
		item.pause();
		item.src = "";
		item.load();
	});
	$("#player_controls").hide();
};

VideoPlayerControls.prototype.back = function() {

	// restore the DOM elements to the default layout
	if (!$('.time_end').length && !$('.position').length) {

		var timeEnd = document.createElement('div');
		timeEnd.className = 'time_end';

		var position = document.createElement('div');
		position.className = 'position';

		$(timeEnd).insertAfter('.time_current');
		$(position).insertAfter('.buffer');

	}
	clearTimeout(window.intervalKeepAlive);
	intervalKeepAlive = undefined;
	this.stopVideo();

	$('#mainNdvrPage').hide();
	$('#videoStream').hide();
	$('#videoContainer').hide();
	$('#videoContent').hide();
	$('#infoNdvrPage').show();

	createInfoMenuItems();

	if (!jQuery.browser.mobile) {
		lastFocused.click();
	}
	this.resetProgressBar();

	var video = this.content.find("video");
	video[0].removeEventListener('ended', playerEndPlaybackEvent);
	document.removeEventListener('keyup', playerKeyEvents);
};

VideoPlayerControls.prototype.resetProgressBar = function() {
	var player;
	player = $("#videoContent");
	player.find(".position").css("width", "0");
	player.find(".time_end").html("00:00").show();
	player.find(".time_current").html("00:00");
	player.find(".current_time").html("00:00");
	player.find(".info").css("left", 0 + "%");
	player.find(".info").hide();

};

VideoPlayerControls.prototype.showPlayerControls = function(inState) {
	var that, status_icon, newClass;
	that = this;

	$("#player_controls").show();
	clearTimeout(this.m_fadeoutTimer);
	this.m_fadeoutTimer = window.setTimeout(function() {
		that.fadeoutPlayerControls();
	}, 6000);

	status_icon = $("#status_icon");
	switch (inState) {
	case "play":
		status_icon.removeClass().addClass("play");
		break;

	case "pause":
		status_icon.removeClass().addClass('pause');
		break;

	case "stop":
		status_icon.removeClass().addClass("stop");
		break;

	case "rewind":
		status_icon.removeClass().addClass("rewind");
		break;

	case "fast_forward":
		status_icon.removeClass().addClass("fast_forward");
		break;
	}
};

VideoPlayerControls.prototype.playerControls = function(inVideoplayer) {
	var self = this;

	var vid_duration, vid_duration_playback, vid_offset_bar, max_playback_sec;
	var player = $("#videoContent");
	var playbar_width;
	var buffered;

	$("#videoContent").find(".time_end").hide();

	if (inVideoplayer.readyState > 0) {

		buffered = inVideoplayer.buffered.end(inVideoplayer);
		vid_duration = self.asset_duration_program_sec;
		vid_duration_playback = self.asset_duration_playback_sec;
		vid_offset_start = self.asset_offset_playback_duration_sec;
		vid_offset_bar = self.asset_offset_playback_bar_sec;

		if (assetInfo.status != 'CAPTURING') {
			asset_offset_end_sec = Math.floor(self.asset_offset_playback_moxi
					+ self.asset_duration_playback_sec);
			asset_offset_end_diff_sec = Math.floor(inVideoplayer.duration
					- asset_offset_end_sec);
			if (asset_offset_end_diff_sec < 0) {
				asset_offset_end_diff_sec = 0;
			}
		}

		vid_duration_playback = inVideoplayer.duration;

		player = $("#videoContent");
		player.find(".time_current").html("00:00").show();
		player.find(".time_end").html(this.convertTime(vid_duration)).show();

		if (vid_duration_playback < self.asset_duration_playback_sec) {
			playbar_width = ((vid_duration_playback - vid_offset_start) / vid_duration) * 100;
			max_playback_sec = vid_duration_playback;
		} else {
			playbar_width = ((self.asset_duration_playback_sec) / vid_duration) * 100;
			max_playback_sec = vid_offset_start
					+ self.asset_duration_playback_sec;
		}

		playbar_offset_start = (vid_offset_bar / vid_duration) * 100;

		player.find(".position").css("width", playbar_width + "%");
		player.find(".position").css("left", playbar_offset_start + "%");
		player.find(".time_end").html(this.convertTime(vid_duration)).show();

		if (buffered > 5) {

			player.find(".info").show();

			current_time_info = ((inVideoplayer.currentTime + vid_offset_bar - vid_offset_start) / vid_duration) * 100;
			player.find(".info").css("left", current_time_info + "%");
			player.find(".current_time").html(
					this.convertTime(vid_offset_bar + inVideoplayer.currentTime
							- vid_offset_start));

		} else {

			player.find(".time_end").html('00:00').show();

		}

		if ((inVideoplayer.currentTime) >= max_playback_sec) {
			playerEndPlaybackEvent();
		}

	}

};

VideoPlayerControls.prototype.fadeoutPlayerControls = function() {
	$("#player_controls").fadeOut(800);
	clearTimeout(this.m_fadeoutTimer);
};

VideoPlayerControls.prototype.timeFormat = {
	showHour : true,
	showMin : true,
	showSec : true,
	padHour : false,
	padMin : true,
	padSec : true,
	sepHour : ":",
	sepMin : ":",
	sepSec : ""
};

VideoPlayerControls.prototype.convertTime = function(s) {
	var myTime, hour, min, sec, strHour, strMin, strSec;
	myTime = new Date(s * 1000);

	hour = myTime.getUTCHours();
	min = myTime.getUTCMinutes();
	sec = myTime.getUTCSeconds();

	strHour = (hour < 10) ? "0" + hour : hour;
	strMin = (min < 10) ? "0" + min : min;
	strSec = (sec < 10) ? "0" + sec : sec;

	return ((this.timeFormat.showHour && hour > 0) ? strHour
			+ this.timeFormat.sepHour : "")
			+ ((this.timeFormat.showMin) ? strMin + this.timeFormat.sepMin : "")
			+ ((this.timeFormat.showSec) ? strSec + this.timeFormat.sepSec : "");
};

function ScrollControl() {
	this.isScrolling = false;
	this.isVisible = false;
	this.currentScroll_py = 0;
	this.animation_transition = 300;
	this.container = undefined;
	this.row_scroll = 1;
	this.row_height = 211;
	this.items_per_row = 7;
	this.isTop = true;
	this.currentRow = 0;
	this.minVisibleRowIndex = 0;
	this.maxVisibleRowIndex = 0;
	this.visibleRows = 2;
	this.callback_complete_animation = function() {
	};
}

ScrollControl.prototype.init = function(container) {
	this.container = container;
};

ScrollControl.prototype.isTop = function() {
	return this.isTop;
};

ScrollControl.prototype.checkVisibleRows = function(item, callback) {
	if (!this.isScrolling) {
		var nextRowIndex = item.cel;
		var minRowVisibleIndex = this.minVisibleRowIndex;
		var maxRowVisibleIndex = this.maxVisibleRowIndex;

		if (maxRowVisibleIndex === 0) {
			maxRowVisibleIndex = this.maxVisibleRowIndex = this.visibleRows;
		}

		if (nextRowIndex < minRowVisibleIndex
				|| nextRowIndex > maxRowVisibleIndex) {
			this.scroll(item.direction, callback);
			this.minVisibleRowIndex = this.minVisibleRowIndex + item.direction;
			this.maxVisibleRowIndex = this.maxVisibleRowIndex + item.direction;
		} else {
			callback();
		}
		this.currentRow = nextRowIndex;
	}
};

ScrollControl.prototype.scroll = function(direction, callback) {
	var that = this;
	var scroll;
	if (direction >= 1) {
		scroll = this.row_height * this.row_scroll + this.currentScroll_py;
	} else {
		scroll = this.row_height * this.row_scroll * -1 + this.currentScroll_py;
	}
	this.currentScroll_py = scroll;

	if (!this.isScrolling) {
		this.isScrolling = true;

		this.container.animate({
			scrollTop : scroll + "px"
		}, {
			complete : function() {
				$('.item').keynavigator();
				that.isScrolling = false;
				callback();
			}
		}, that.animation_transition);
	}
};

ScrollControl.prototype.reset = function() {
	this.container.scrollTop(0);
	this.isTop = true;
	this.minVisibleRowIndex = 0;
	this.maxVisibleRowIndex = 0;
	this.maxVisibleRowIndex = 0;
	this.currentRow = 0;
	this.currentScroll_py = 0;
};

ScrollControl.prototype.scrollToCurrentPosition = function() {
	this.container.scrollTop(this.currentScroll_py);
};

function OptionsMenus() {
	this.isVisible = false;
	this.currentNode = false;
	this.container = "#navOptionsBarContainer";
	this.options = [];
	this.subCategoriesOptions = [];
	this.sortOptions = {};
}

OptionsMenus.prototype.init = function(options) {
	this.options = options;
	this.sortOptions.type_sort = "desc";
	this.sortOptions.by = "date";
};

OptionsMenus.prototype.enter = function(e, item) {

	var index = item.index();
	var id = item.attr('id');
	var nodeEnter = opt.findNode(id, opt.options[0]);
	if (nodeEnter.subOptions.length > 0) {
		opt.currentNode = nodeEnter;
		var subOptions = opt.currentNode.subOptions;
		opt.render(subOptions);
	}
	// this.subCategoriesOptions = this.options.
};

OptionsMenus.prototype.listOptions = function(ul, item) {
	var row = $('<li/>');
	row.attr('class', 'navOptionContent-no-after');

	row.bind('noMoreItemsLeft', function(name) {
		return function() {
			$('#' + name).trigger("touchspin.downonce");
		};
	}(item.title));
	row.bind('noMoreItemsRight', function(name) {
		return function() {
			$('#' + name).trigger("touchspin.uponce");
		};
	}(item.title));

	var divColumLabel = $('<div/>');
	divColumLabel.attr('class', 'col-sm-5');
	var spanLabel = $('<span/>');
	spanLabel.attr('class', 'labelIncremental_LeftMenu');
	spanLabel.html(item.title).appendTo(divColumLabel);
	divColumLabel.appendTo(row);

	var divColumInput = $('<div/>');
	divColumInput.attr('class', 'col-sm-12');
	var input = $('<input/>');
	input.attr('id', item.title);
	input.attr('type', 'text');
	input.attr('value', '');
	input.attr('readonly', 'readonly');
	input.attr('name', item.title);
	input.html(item.title).appendTo(divColumInput);
	divColumInput.appendTo(row);
	row.appendTo(ul);
};

OptionsMenus.prototype.render = function(options) {
	var ul = $(this.container).find('ul');
	var existList = false;
	var divContent = undefined;
	ul.empty();
	var that = this;
	var indexArray = [ window.scheduleOption_startOffset_index,
			window.scheduleOption_endOffset_index,
			window.scheduleOption_keep_index,
			window.scheduleOption_accept_index ];
	$
			.each(
					options,
					function(i, item) {
						if (item.type && item.type == 'list') {
							if (!existList) {
								var back = $('<li/>');
								back.attr('class', 'navOptionContent-no-after');
								existList = true;
								back.bind('noMoreItemsLeft', function() {
									that.back();
									sendSubscriberOptions();
								});
								back.bind('eventEnter', function() {
									that.back();
									sendSubscriberOptions();
								});
								back.html("Back").appendTo(ul);
							}

							that.listOptions(ul, item);
							$("input[name='" + item.title + "']")
									.TouchSpin(
											{
												verticalbuttons : false,
												itemName : item.title,
												buttondown_class : 'increment_Button',
												buttonup_class : 'increment_Button',
												inputClass : 'inputSkin textLetter',
												initval : configGuide.ScheduleOptions[i].friendMsg[indexArray[i]],
												initIndex : indexArray[i],
												min : configGuide.ScheduleOptions[i].friendMsg[0],
												arrayValue : configGuide.ScheduleOptions[i].friendMsg,
												max : configGuide.ScheduleOptions[i].friendMsg[configGuide.ScheduleOptions[i].friendMsg.length - 1]
											});
						} else {
							var li = $('<li/>').attr('action', item.action)
									.attr('id', item.id).attr('field',
											item.field).bind('noMoreItemsLeft',
											that.back).bind('eventBack',
											that.close)

							if (item.subOptions.length == 0) {
								li.addClass('navOptionContent-no-after');
								li.bind('eventEnter', that.optionExecution);
							} else {
								li.bind('eventEnter', that.enter).bind(
										'noMoreItemsRight', that.enter);
							}
							li.html(item.title).appendTo(ul);
						}

					});
	list = ul.find('li');
	list.keynavigator();
	list.first().click();
	if (existList) {
		var inputContent = ul.find('.contentInput');
		inputContent.addClass('navOptionContent-no-after');
		inputContent.keynavigator();
	}

};

OptionsMenus.prototype.back = function(e, item) {
	if (opt.currentNode.id != 'root') {
		var parId = opt.currentNode.parent;
		var nodeParent = opt.findNode(parId, opt.options[0]);
		opt.currentNode = nodeParent;
		var subOptions = opt.currentNode.subOptions;
		opt.render(subOptions);
	} else {
		opt.close();
	}

};

OptionsMenus.prototype.findNode = function(id, currentNode) {

	if (id == currentNode.id) {
		return currentNode;
	} else {
		var result;
		for ( var index in currentNode.subOptions) {
			var node = currentNode.subOptions[index];
			if (node.id == id)
				return node;
			node = opt.findNode(id, node);
			if (node) {
				return node;
			}
		}
		return false;
	}

};

OptionsMenus.prototype.show = function() {

	getSubscriberRecOption();

	$('#navContent').find('li').removeClass('active');
	this.isVisible = true;
	$(this.container).velocity({
		'margin-left' : '0px'
	}, 200);
	this.currentNode = this.options[0];
	this.render(this.options[0].subOptions);
};

OptionsMenus.prototype.close = function() {
	this.isVisible = false;
	this.currentNode = false;

	$(opt.container).velocity({
		'margin-left' : '-413px'
	}, 200);
	setTimeout(function() {
		$('#navOptionContent').find('li').removeClass('active');
		$($('#navContent').find('li')[lastNavFocusPosition]).click();
		// $('#navContent').find('li')[lastNavFocusPosition].click();
	}, 250);

};

OptionsMenus.prototype.closeOption = function(e, item) {
	this.close();
};

OptionsMenus.prototype.optionExecution = function(e, item) {
	var action = item.attr('action');
	var field = item.attr('field');

	switch (action) {
	case "sort":
		opt.sortBy(field);
		break;

	case "sort_options":
		opt.sortOptionsApply(field);
		break;

	default:
		break;
	}
};

OptionsMenus.prototype.sortBy = function(field) {

	var items, sortedItems;
	switch (lastNavFocusPosition) {
	case 0:
		items = allItemsSR;
		break;
	case 1:
		items = allItemsPR;
		break;
	case 2:
		items = window.catchupFiltered;
		break;
	case 3:
		items = allItemsDEL;
		break;
	}

	if (field == "date") {
		sortedItems = items;
	} else {
		this.sortOptions.by = "title";
		sortedItems = _.sortBy(items, function(obj) {
			return obj.title;
		}).reverse();
	}

	if (this.sortOptions.type_sort == "asc") {
		sortedItems = sortedItems.reverse();
	}

	$("#scrollContainer").empty();
	loadItems("#ndvrContainer", sortedItems);
	this.close();

};
OptionsMenus.prototype.sortOptionsApply = function(field) {
	this.sortOptions.type_sort = field;
	this.sortBy(this.sortOptions.by);
};

var scroller = new ScrollControl();
var opt = new OptionsMenus();

(function(a) {
	(jQuery.browser = jQuery.browser || {}).mobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i
			.test(a)
			|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i
					.test(a.substr(0, 4));
})(navigator.userAgent || navigator.vendor || window.opera);

function getQueryParams(qs) {
	qs = qs.split("+").join(" ");

	var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;

	while (tokens = re.exec(qs)) {
		params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
	}

	return params;
}

$(window).load(function() {
	var that = this;
	function validateSubscriberInfo() {
		// Test Monitor
		var msgObj = {};
		msgObj.className = "dataMonitorMsg";
		msgObj.msg = "Validating Subscriber: " + subscriberParam;
		reportActivity(msgObj);
		// Test Monitor------------------------------
		var async = false;
		var deferred = validateSubscriber(async, subscriberParam);
		$.when(deferred).done(function(data) {
			if (data.subscriber && data.subscriber.ERROR) {
				informErrorActivity(data.subscriber);
			} else {
				informSuccessActivity(data.subscriber);
				window.params.subscriber = data.subscriber;
			}
		});
	}

	validateSubscriberInfo();

});

$(document)
		.ready(
				function() {

					loggingOptions = {
						"enabled" : false,
						"console" : true,
						"overlay_max_height" : 500,
						"areas" : {
							"ALL" : MWLogger.LEVEL.ALL
						}
					};

					subscriberParam = getLocalStorageSubscriberName();
					window.params.subscriberName = subscriberParam;
					window.params.userSelected = getLocalStorageUser();
					if (!subscriberParam) {
						subscriberParam = getLocalStorageSubscriberVolatile();
						window.params.subscriberName = subscriberParam;
					}
					window.params.test = "true";

					var position = {};
					position.x = 0.20;
					position.y = 0.40;
					createMonitorDialog(position);

					logger = new MWLogger(loggingOptions);

					// needed vars for getting the last active items on the
					// panels
					// set the default value to 0 (the first item)
					var posterFocusPosition = 0;
					leftNavFocusPosition = 0;
					lastNavFocusPosition = undefined;

					var rigthMenuLiEvent = function(e, item) {

						if ($('.item').length) {
							isFullScreenPosters = true;
							$('#navBarContainer').velocity({
								'margin-left' : '-448px'
							}, 200);
							$('#ndvrContainer').velocity({
								'width' : '1280px',
								'padding-top' : '15px',
								'padding-right' : '70px',
								'padding-bottom' : '6px',
								'padding-left' : '70px'
							}, {
								complete : function() {
								}
							}, 200);
							$('.item').keynavigator();
							$('.item').first().click();
							$('.item').first().addClass('active');
							leftNavFocusPosition = $('#navBarContainer').find(
									'.active').index();
							// set the path name on the header UI
							setHeaderNaming(leftNavFocusPosition);
						}
					};

					var leftMenuLiEvent = function(e, item) {

						isFullScreenPosters = false;
						opt.show();
					};

					var onAfterActiveMenu = function(e, item) {
						var indexNav = e.index();
						if (lastNavFocusPosition === undefined
								|| indexNav !== lastNavFocusPosition) {
							lastNavFocusPosition = indexNav;
							$("#scrollContainer").empty();
							loadItemsByType(e.attr('type'), "#ndvrContainer");
							posterFocusPosition = 0;
						}
						lastNavFocusPosition = indexNav;

					};

					scroller.init($('#scrollContainer'));

					$.ajax({
						dataType : "json",
						async : false,
						url : './config/serviceConfig.json',
						success : function(json) {
							window.params.serviceConfig = json;
						}
					});
					
					$.ajax({
						dataType : "json",
						async : false,
						url : './config/config_ui.json',
						success : function(json) {
							config = json;
						}
					});

					$.ajax({
						dataType : "json",
						async : false,
						url : './config/configGuide.json',
						success : function(json) {
							configGuide = json;
						}
					});

					var options = config.config_ui.mainScreenConfig.options;
					opt.init(options);

					createMenuItems();

					$.ajax({
						dataType : "json",
						async : false,
						url : './config/tv_rating_mapping.json',
						success : function(json) {
							config_tv_ratings = json;
						}
					});

					pin = config.config_ui.pinForCleanNdvrMoxiData;
					
/*					
					refreshMainPage_cuis = function(call, isonLoad){
						$('#loadingIconHeader').show();
						this.isonload = isOnLoad;
						
						var cuisService = new cuisService();
						
						$.ajax({
							type : "POST",
							url : "ServerService",
							contentType : 'application/json',
							mimeType : 'application/json',
							data : dataRequest,
							success : function(data) {
								clearScreen(false);

								if (data.Recordings	&& data.Recordings[0] && data.Recordings[0].ERROR) {
									$('#linkIconHeader img').attr('src','css/images/linkNotAvailable.png');
									$('.headerOptionsLabel').html('NDVR Server ' + data.Recordings[0].ERROR);
									return;
								} else {
									$('#linkIconHeader img').attr('src', 'css/images/linkAvailable.png');
									$('.headerOptionsLabel').html('Press "Left Arrow" on the remote control to access OPTIONS');
								}
								getOldObjects();

								allItemsPR = parseResponse(data, "Recordings");
								allItemsSR = parseResponse(data, "Schedules");
								window.seriesSets = parseSeriesResponse(data);

								
								
								$.merge(allItems, allItemsPR);
								$.merge(allItems, allItemsSR);
								$.merge(allItems, allItemsDEL);

								seekDiffs(data);
								setHashMap(data);

							},
							complete : function(data, e) {

								$('#loadingIconHeader').hide();
								if (!opt.isVisible) {
									handleFocusRefreshScreen();
								}
								addNavigationItems();
								pendingRefresh = false;
								isRefresh_SR_PR = false;
								if (callback) {
									callback();
								}
							},
							error : function(XMLHttpRequest,
									textStatus, errorThrown) {
								$('#linkIconHeader img').attr('src','css/images/linkNotAvailable.png');
								$('.headerOptionsLabel').html('Ui Server: Error connection refused');
							}
						});
						
						
						
						
					}
*/					
					

					refreshMainPage = function(callback, isOnLoad) {
						
						$('#loadingIconHeader').show();

						var requestInfo = {};						
						if (isOnLoad) {
						   requestInfo.actionService = "GET";
						   requestInfo.exclude = "NONE";
						   requestInfo.subscriber = window.params.subscriberName;
						   requestInfo.userId = window.params.userSelected.id;
						} else {
						  requestInfo.actionService = "GET";
						  requestInfo.exclude = "CATCHUP_TV";
						  requestInfo.subscriber = window.params.subscriberName;
						  requestInfo.userId = window.params.userSelected.id;
						}
						
						var cuisService = new CUIS();
						response = cuisService.getRecordings(requestInfo.subscriber, requestInfo.userId);
						getOldObjects();
						allItemsPR = parseResponse(response, "Recordings");
						allItemsSR = parseResponse(response, "Schedules");
						
						if (callback) {
							callback();
						}
						
//						var dataRequest = JSON.stringify(requestInfo);
//						var that = this;
//						this.isonload = isOnLoad;
//						$
//								.ajax({
//									type : "POST",
//									url : "ServerService",
//									contentType : 'application/json',
//									mimeType : 'application/json',
//									data : dataRequest,
//									success : function(data) {
//										clearScreen(false);
//
//										if (data.Recordings
//												&& data.Recordings[0]
//												&& data.Recordings[0].ERROR) {
//											$('#linkIconHeader img').attr('src','css/images/linkNotAvailable.png');
//											$('.headerOptionsLabel').html('NDVR Server ' + data.Recordings[0].ERROR);
//											return;
//										} else {
//											$('#linkIconHeader img')
//													.attr('src', 'css/images/linkAvailable.png');
//											$('.headerOptionsLabel').html('Press "Left Arrow" on the remote control to access OPTIONS');
//										}
//										getOldObjects();
//
//										allItemsPR = parseResponse(data, "Recordings");
//										allItemsSR = parseResponse(data, "Schedules");
//										window.seriesSets = parseSeriesResponse(data);
//
//										
//										
//										$.merge(allItems, allItemsPR);
//										$.merge(allItems, allItemsSR);
//										$.merge(allItems, allItemsDEL);
//
//										seekDiffs(data);
//										setHashMap(data);
//
//									},
//									complete : function(data, e) {
//
//										$('#loadingIconHeader').hide();
//										if (!opt.isVisible) {
//											handleFocusRefreshScreen();
//										}
//										addNavigationItems();
//										pendingRefresh = false;
//										isRefresh_SR_PR = false;
//										if (callback) {
//											callback();
//										}
//									},
//									error : function(XMLHttpRequest,
//											textStatus, errorThrown) {
//										$('#linkIconHeader img').attr('src','css/images/linkNotAvailable.png');
//										$('.headerOptionsLabel').html('Ui Server: Error connection refused');
//									}
//								});
					};
					

					refreshCatchUp = function(callback) {

						$('#loadingIconHeader').show();
						var requestInfo = {};
						requestInfo.actionService = "GET";
						requestInfo.exclude = "NONE";
						requestInfo.subscriber = window.params.subscriberName;
						requestInfo.userId = window.params.userSelected.id;
						var dataRequest = JSON.stringify(requestInfo);
						$.ajax({
									type : "POST",
									url : "ServerService",
									contentType : 'application/json',
									mimeType : 'application/json',
									data : dataRequest,
									success : function(data) {
										clearScreen(true);
										if (data.CATCHUP_TV[0] && data.CATCHUP_TV[0].ERROR) {
											$('#linkIconHeader img').attr('src','css/images/linkNotAvailable.png');
											$('.headerOptionsLabel').html('NDVR Server ' + data.CATCHUP_TV[0].ERROR);
											return;
										} else {
											$('#linkIconHeader img').attr('src', 'css/images/linkAvailable.png');
											$('.headerOptionsLabel').html('Press "Left Arrow" on the remote control to access OPTIONS');
										}
										
										getOldObjects();
										
										window.catchup = parseCatchupResponse(data);

										seekDiffs(data);
										setHashMap(data);

									},
									complete : function(data, e) {

										$('#loadingIconHeader').hide();
										if (!opt.isVisible) {
											handleFocusRefreshScreen();
										}
										addNavigationItems();
										pendingRefreshCatchUp = false;
										isRefresh_TSR = false;
										if (callback) {
											callback();
										}
									},

									error : function(XMLHttpRequest, textStatus, errorThrown) {
										$('#linkIconHeader img').attr('src', 'css/images/linkNotAvailable.png');
										$('.headerOptionsLabel').html('Ui Server: Error connection refused');
									}
								});
					};

					refreshDeleted = function(callback) {

						$('#loadingIconHeader').show();
						var requestInfo = {};
						requestInfo.actionService = "GET";
						requestInfo.exclude = "";
						requestInfo.exclusive = "DELETED";
						requestInfo.subscriber = window.params.subscriberName;
						requestInfo.userId = window.params.userSelected.id;
						var dataRequest = JSON.stringify(requestInfo);
						
						$.ajax({
									type : "POST",
									url : "ServerService",
									contentType : 'application/json',
									mimeType : 'application/json',
									data : dataRequest,
									success : function(data) {
										clearScreen(true);
										if (data.DELETED[0]	&& data.DELETED[0].ERROR) {
											$('#linkIconHeader img').attr('src','css/images/linkNotAvailable.png');
											$('.headerOptionsLabel').html('NDVR Server ' + data.DELETED[0].ERROR);
											return;
										} else {
											$('#linkIconHeader img').attr('src','css/images/linkAvailable.png');
											$('.headerOptionsLabel').html('Press "Left Arrow" on the remote control to access OPTIONS');
										}
										getOldObjects();

										allItemsDEL = parseResponse(data,"DELETED");

										$.merge(allItems, allItemsPR);
										$.merge(allItems, allItemsSR);
										$.merge(allItems, allItemsDEL);

										seekDiffs(data);
										setHashMap(data);

									},
									complete : function(data, e) {

										$('#loadingIconHeader').hide();
										if (!opt.isVisible) {
											handleFocusRefreshScreen();
										}
										addNavigationItems();
										pendingRefreshDeleted = false;
										isRefresh_Deleted = false;
										if (callback) {
											callback();
										}
									},

									error : function(XMLHttpRequest,
											textStatus, errorThrown) {
										$('#linkIconHeader img').attr('src','css/images/linkNotAvailable.png');
										$('.headerOptionsLabel').html('Ui Server: Error connection refused');
									}
								});
					};

					isRefresh_TSR = true;
					refreshCatchUp(function() {
						isRefresh_SR_PR = true;
						refreshMainPage(function() {
							resetIntervalRefreshCatchUp();
							resetIntervalRefresh();
							isRefresh_Deleted = true;
							refreshDeleted(function() {
								resetIntervalRefreshDeleted();
							});
						});
					});

					function resetIntervalRefresh() {
						if (config.config_ui.refresh) {
							clearTimeout(intervalRefresh);
							intervalRefresh = setInterval(function() {
								if ($('#mainNdvrPage').is(':visible')) {
									isRefresh_SR_PR = true;
									refreshMainPage();
									pendingRefresh = false;
								} else {
									pendingRefresh = true;
								}
							}, config.config_ui.refresh_interval_ms);
						}
					}

					function resetIntervalRefreshCatchUp() {
						if (config.config_ui.refresh_interval_catchup_ms) {
							clearTimeout(intervalRefreshCatchUp);
							intervalRefreshCatchUp = setInterval(function() {
								if ($('#mainNdvrPage').is(':visible')) {
									isRefresh_TSR = true;
									refreshCatchUp();
									pendingRefreshCatchUp = false;
								} else {
									pendingRefreshCatchUp = true;
								}
							}, config.config_ui.refresh_interval_catchup_ms);
						}
					}

					function resetIntervalRefreshDeleted() {
						if (config.config_ui.refresh_interval_deleted_ms) {
							clearTimeout(intervalRefreshDeleted);
							intervalRefreshDeleted = setInterval(function() {
								if ($('#mainNdvrPage').is(':visible')) {
									isRefresh_Deleted = true;
									refreshDeleted();
									pendingRefreshDeleted = false;
								} else {
									pendingRefreshDeleted = true;
								}
							}, config.config_ui.refresh_interval_deleted_ms);
						}
					}

					function clearScreen(isCatchUp) {
						if (isRefresh_SR_PR || isRefresh_TSR
								|| isRefresh_Deleted) {
							allItems = [];
							currentItems = [];
							var selected = $('#mainNdvrPage').find('.active');
							lastSelectedIdBefRefresh = selected.attr('id');
							var ul = $('.left_menu ul');
							var list;
							list = ul.find('li');
						}
					}

					function loadItemsByType(type, content) {
						switch (type) {
						case "PR":
							currentItems = allItemsPR;
							break;
						case "TSR":
							window.catchupFiltered = removeInvalidCatchup(window.catchup);
							currentItems = window.catchupFiltered;
							break;
						case "SR":
							currentItems = allItemsSR;
							break;
						case "RD":
							currentItems = allItemsDEL;
							break;
						case "SRS":
							currentItems = window.seriesSets;
							break;
						}
						
						if (type) {
							loadItems(content, currentItems);
						}
					}

					loadItems = function(content, arrayItems) {
						var scrollContainer = $(content).find(
								'.scrollContainer');
						if (arrayItems) {
							$.each(arrayItems, function(i, item) {
								var itemData = item;
								renderItem(content, item);
							});
						}
					}

					function addNavigationItems() {
						if (isFullScreenPosters) {
							if (isRefresh_SR_PR || isRefresh_TSR
									|| isRefresh_Deleted) {
								setTimeout(
										function() {
											var scrollContainer = scroller.container;
											if (scrollContainer.children().length > 0) {
												$('.item').keynavigator();
												var activeItem = $('#scrollContainer .active');
												if (activeItem.length) {
													activeItem.click();
												} else {
													$('.item').first().click();
													scroller.reset();
												}
											} else {
												noMoreItemsLeft();
											}

										}, 300);
							}
						}
					}

					var setFocusOnEpisodes = function() {
						$('#infoListSeries .active').removeClass("active");
						$('#episodeList li').first().click();
						$('#episodeList').scrollTop(0);

					};
					
					function createMenuCatchup(){
						var ul = $('.seriesAction');
						$('.seriesAction').children().remove();
						$('.seriesAction li').keynavigator();
						var menuItemsArray = getRecSetOptionByType(assetInfo.content_type);
						$.each(menuItemsArray, function(i, item) {
							var li = $('<li/>').addClass('infoOptionsAssetMenu action-menu')
							.attr('action', item.action)
							.bind('eventEnter', infoMenuItemActionEvent)
							.bind('eventBack', backAction);
 							li.bind('noMoreItemsLeft', setFocusOnEpisodes);
							li.html(item.title)
							li.appendTo(ul);
						});

						$('.seriesAction li').keynavigator();
					}

					function createMenuSeries() {
						var ul = $('.seriesAction');
						$('.seriesAction').children().remove();
						$('.seriesAction li').keynavigator();
						var menuItemsArray = getSeriesSetOptionByStatus(assetInfo.content_type, assetInfo.state);
						$.each(menuItemsArray, function(i, item) {
							var li = $('<li/>').addClass('infoOptionsAssetMenu action-menu')
							.attr('action', item.action)
							.bind('eventEnter', infoMenuItemActionEvent)
							.bind('eventBack', backAction);
 							li.bind('noMoreItemsLeft', setFocusOnEpisodes);
							li.html(item.title)
							li.appendTo(ul);
						});

						$('.seriesAction li').keynavigator();
					}

					function createForEmptyListProgram(cont, message) {
						var li = $('<li/>');
						li.attr("id", "noneEpisodes");
						var span1 = $('<span/>');

						span1.attr("class", "series-name");
						span1.html(message);
						span1.appendTo(li);
						li.appendTo(cont);
					}

					function addEpisodeIconStatus(episodes) {
						$.each(episodes, function(i, episode) {
							var iconContainer = $('#episodeList').find('#' + episode.id).find('.episodeStatus');
							iconContainer.addClass('episode' + episode.status);
							iconContainer.show();
						});
					}

					function createMenuItems() {
						var ul = $('.left_menu ul');
						var list;
						list = ul.find('li');
						if (ul.children().length < 1) {
							var menuItems = config.config_ui.mainScreenConfig.menuItems;
							$.each(menuItems, function(i, item) {
								if (!item.action.length > 0) {
									var li = $('<li/>').bind('right',
											openGuide.bind(this)).bind(
											'eventEnter', openGuide.bind(this))
											.html(item.title).appendTo(ul);

								} else {
									var li = $('<li/>').attr('type',
											item.action).bind('right',
											rigthMenuLiEvent).bind('eventG',
											openGuide.bind(this)).bind(
											'eventEnter', rigthMenuLiEvent)
											.bind('noMoreItemsLeft',
													leftMenuLiEvent).html(
													item.title).appendTo(ul);
								}
							});
							list = ul.find('li');
							list.keynavigator({
								onAfterActive : onAfterActiveMenu
							});

						}
					}

					function addCheck() {
						var ul = $('#infoListOptions');
						$.each(ul.children(), function(i, item) {
							if ($(item).attr('action') === "keepforever") {
								var checkContainer = jQuery('<div/>', {
									"class" : "checkContainer",
									"style" : "display: inline;"
								});
								var img = jQuery('<img/>', {
									"class" : "img-responsive checkIcon",
									"src" : './css/images/button-check.png'
								});
								checkContainer.append(img);
								$(item).append(checkContainer);
							}
						});
					}

					function openGuide() {
						window.location.href = "./guide.html";
						return false;
					}

					function handleFocusRefreshScreen() {
						var list = $('.left_menu li');
						if (isRefresh_SR_PR || isRefresh_TSR
								|| isRefresh_Deleted) {
							if (!isFullScreenPosters) {
								settleFocusState('#navContent', 'li',
										lastNavFocusPosition);
							}
						} else {
							list.first().click();
						}
					}

					var eventBackUpdateAssetStatus = function(that) {
						reportUpdateStatus();
						var responseItem = that.assetInfoResponse.info;
						if (responseItem) {
							informSuccessActivity(responseItem);
							if (assetInfo.status === responseItem.status.state) {
							} else {
								assetInfo.status = responseItem.status.state;
								if (assetInfo.status === "COMPLETED"
										|| assetInfo.status === "CAPTURING") {
									assetInfo.type = "RECORDINGS";
								} else if (assetInfo.status === "DELETED") {
									assetInfo.type = "DELETED";
								} else if (assetInfo.status === "ERROR") {
									assetInfo.type = "ERROR";
								} else if (assetInfo.status === "SCHEDULED") {
									assetInfo.type = "SCHEDULED";
								}
							}
						}
						updateCallActions();
					};

					var seriesActionFocus = function() {
						$('#episodeList .active').removeClass("active");
						$('.seriesAction li').first().click();
					};

					var recordingActionFocus = function() {
						$('#infoListOptions .active').removeClass("active");
						$('#infoListOptions li').first().click();
					};

					function scroll(child, parent, dir) {
						var index = ($("#" + parent.id + ' > li.active')
								.index()) + 1;
						var total = $("#" + parent.id + ' li').size();
						var position = child.offsetTop;
						var height = parent.clientHeight;
						var diffPoscont;
						var diff;

						if (dir == "down"
								&& parent.scrollTop < parent.scrollHeight) {
							diffPosCont = (position) + (child.clientHeight * 2);
							diff = (parent.scrollTop * 0.98)
									+ (parent.clientHeight);
							if (diffPosCont >= diff && index < total) {
								parent.scrollTop = parent.scrollTop
										+ (child.clientHeight + 1);
							} else if (index == total) {
								parent.scrollTop = 0;
							}
						}

						if (dir == "up" && parent.scrollTop >= 0) {
							diffPosCont = position - (child.clientHeight * 2);
							diff = parent.scrollTop + child.clientHeight;
							if (diffPosCont <= diff && dir == "up" && index > 1) {
								parent.scrollTop = parent.scrollTop
										- (child.clientHeight + 1);
							} else if (index == 1) {
								parent.scrollTop = parent.scrollHeight;
							}
						}
					}

					function addCollectionNav(){
						// set the first active and add navigation
						$('#episodeList li').keynavigator({	cycle : true })
						.on('up', function(e) { scroll(this, this.parentElement, "up");})
						.on('down', function(e) {	scroll(this, this.parentElement, "down");});
						var first = $('#episodeList li:first');
						first.addClass('active');
						first.click();
						$('#episodeList').scrollTop(0);
					}
					
					function renderCatchupProgram(item){
						// render the list episodes
						var cont = $('#episodeList');
						cont.children().remove();
						var temp = $('#programTemplate').html();

						if (item.programs.length > 0) {
							item.programs.sort(function(a, b) {
								return new Date(a.eventStart) - new Date(b.eventStart);
							});
							
							cont.html(_.template(temp, {data : item.programs }));
							$('#episodeList li').bind('eventEnter',	recSetProgramInfoShow)
							.bind('eventBack', backToMain)
							.bind('noMoreItemsLeft', backToMain)
							.bind('noMoreItemsRight', seriesActionFocus);
							
							addCollectionNav();
						} else {
							createForEmptyListProgram(cont,"No programs available");
						}
						
						var title = item.name;

						title ? $('.infoMainTitle').html(title).show(): $('.infoMainTitle').hide();
						$('#seriesImg').attr("class", "infoitemImg");
						$('.infoSubTitle').hide();
						$('#infoSeriesSinopsys').hide();
						$('#seriesRate').hide();
						$('#seriesYear').hide();
						$('#seriesRepeat').hide();
						$('#seriesImg').attr('src', 'css/images/no_poster_available_v3.jpg');
						$('.seriesAction li').first().addClass('active').click();
					}
					
					function recSetProgramInfoShow() {
						recordingSetSelected = assetInfo;
						var id = $('#episodeList .active').attr('id');
						assetInfo = _.findWhere(assetInfo.programs, {'id' : id});
						assetInfo.programUrl = assetInfo.program;
						getProgInfo(assetInfo, function() {
							assetInfo.type = CONSTANTS.CATCHUP_TV_TYPE;
							showAssetInfo(assetInfo);
							$('#infoSeriesNdvrPage').hide();
							$('#infoNdvrPage').show();
							createInfoMenuItems();
						});
					}
					
					function renderSeriesInfo(item) {

						// render the list episodes
						var cont = $('#episodeList');
						cont.children().remove();
						var temp = $('#episodeTemplate').html();

						if (item.episodes.length > 0) {
							item.episodes.sort(function(a, b) {
								return new Date(a.recordingStart)
										- new Date(b.recordingStart);
							}); // Let's ensure the episodes are sorted by
								// DATE-ASCENDENT, switch a and b to change the
								// order ASC/DES.
							cont.html(_.template(temp, {
								data : item.episodes
							}));
							$('#episodeList li').bind('eventEnter',	episodeInfoShow)
							.bind('eventBack',backToMain).bind('noMoreItemsLeft', backToMain)
							.bind('noMoreItemsRight', seriesActionFocus);

							addEpisodeIconStatus(item.episodes);
							addCollectionNav();

						} else {
							createForEmptyListProgram(cont,"No scheduled episodes");
						}

						function episodeInfoShow() {
							var id = $('#episodeList .active').attr('id');
							var episodesArray = item.episodes;
							assetInfo = _.findWhere(episodesArray, {
								'id' : id
							});
							
							updateAssetStatus(assetInfo, function(that,	itemList) {
								reportUpdateStatus();
								var responseItem = that.assetInfoResponse.info;
								if (responseItem) {
									informSuccessActivity(responseItem);
									getProgInfo(assetInfo, function() {
										showAssetInfo(assetInfo);
										$('#infoSeriesNdvrPage').hide();
										$('#infoNdvrPage').show();
										createInfoMenuItems();
									});
								}
							});

						}

						var title = item.title;
						var subtitle = item.subtitle;
						var sinopsys = item.sinopsys;
						var img = item.url_img_poster;
						var rate = getTvRating(item.rate);
						var year = item.year;
						var repeat = item.repeat;

						title ? $('.infoMainTitle').html(item.title).show(): $('.infoMainTitle').hide();
						$('#seriesImg').attr("class", "infoitemImg");
						if (item.episodes.length > 0) {
							loadPosterAsync('#seriesImg', item.episodes[0].programId);
							subtitle ? $('.infoSubTitle').html(subtitle).show() : $('.infoSubTitle').hide();
							sinopsys ? $('#infoSeriesSinopsys').html(sinopsys).show() : $('#infoSeriesSinopsys').hide();
							rate ? $('#seriesRate').html(rate) : $('#seriesRate').hide();
							year ? $('#seriesYear').html(year) : $('#seriesYear').hide();
							repeat ? $('#seriesRepeat').html(repeat) : $('#seriesRepeat').hide();
						} else {
							$('.infoSubTitle').hide();
							$('#infoSeriesSinopsys').hide();
							$('#seriesRate').hide();
							$('#seriesYear').hide();
							$('#seriesRepeat').hide();
							$('#seriesImg').attr('src',	'css/images/no_poster_available_v3.jpg');
							$('.seriesAction li').first().addClass('active').click();
						}

						// $('#seriesImg').attr("onerror","this.src='css/images/series_placeholder.jpg'");

					}

					function loadPosterAsync(element, programId) {
						// Try on Internet
						$(element).attr('src',
								'posterImage/' + programId + '.jpg').error(
								function() {
									$(element).unbind('error');
									loadPosterRetry(element, programId)
								});
					}

					function loadPosterRetry(element, programId) {
						var url = config.config_ui.imageServer.replace(
								"{programId}", programId);
						$(element)
								.attr('src', url)
								.error(
										function() {
											$(this)
													.attr('src',
															'css/images/no_poster_available_v3.jpg');
										});
					}

					function loadChannelIconAsync(element, channelId) {
						// Try on Internet
						$(element).attr('src',
								'channelLogo/' + channelId + '.png').error(
								function() {
									$(element).unbind('error');
									loadChannelIconRetry(element, channelId)
								});
					}

					function loadChannelIconRetry(element, channelId) {
						var url = config.config_ui.channelIcon + channelId;
						$(element).attr('src', url).error(
								function() {
									$(this).attr('src',
											'css/images/defaultChannel.png');
								});
					}

					function renderCallActionMenu() {
						var infoPage = $('#infoNdvrPage');
						infoPage.show();
						showAssetInfo(assetInfo);
						createInfoMenuItems();
					}

					function updateCallActions() {
						createInfoMenuItems();
					}

					function refreshSeriesCounter() {
						$('#' + seriesSelected.id + " div.series-number").html(
								seriesSelected.episodes.length);
					}
					
					var eventEnterCatchUpItem = function(e, item) {
						var id, content_type, search_content = false;
						lastFocusedMainPage = item;
						id = item.attr("id");
						content_type = item.attr("content_type");
						if (content_type == CONSTANTS.CATCHUP_CONTENT_TYPE) {
							search_content = true;
						}
						var itemFound = _.findWhere(window.catchupFiltered, {id : id});
						assetInfo = itemFound;
						if(itemFound){
						  $('#loadingIconHeader').show();	
						  getRecordingSetChildren(assetInfo, function(){
							  showRecordingSetProg();
							  $('#loadingIconHeader').show();
							  });
						}
												
					};
					
					
					var eventEnterSeriesItem = function(e, item) {
						var id, content_type, search_content = false;
						lastFocusedMainPage = item;
						id = item.attr("id");
						content_type = item.attr("content_type");
						if (content_type == CONSTANTS.SUBSCRIBER_SERIES_RECORDING) {
							search_content = true;
						}
						var itemFound = _.findWhere(window.seriesSets, {id : id});
						assetInfo = itemFound;
						if(assetInfo && assetInfo.content_type === "SubscriberSeriesRecording"){//Enter key in series
						   $('#mainNdvrPage').hide();
						   infoScreenSelect();
						   renderSeriesInfo(assetInfo);
						   createMenuSeries();
						} 
				   };

					
					function showRecordingSetProg(){
						renderCatchupProgram(assetInfo);
						createMenuCatchup();
						$('#mainNdvrPage').hide();
						$('#infoNdvrPage').hide();
						$('#collectionLabel').html("PROGRAMS");
						$('#infoSeriesNdvrPage').show();
						$('#infoListOptions').empty();
						if ($('#episodeList .active') && assetInfo.programs.length > 0) {
							$('#episodeList .active').click();
						}else{
							$('#infoListSeries li').first().click();
						}
					}

					var eventEnterItem = function(e, item) {
						var id, type, content_type;

						lastFocusedMainPage = item;
						id = item.attr("id");
						content_type = item.attr("content_type");
						type = item.attr("type");
						$.each(allItems, function(pox, itemFound) {
							if (itemFound.id == id) {
								assetInfo = itemFound;
								return false;
							}
						});
						$('#mainNdvrPage').hide();
						infoScreenSelect();

						if (assetInfo.type != "CATCHUP_TV") {
							updateAssetStatus(assetInfo, eventBackUpdateAssetStatus);
						}
						/*
						 * get the program metadata from CS
						 */
						getProgInfo(assetInfo, renderCallActionMenu);
						removeNdvrClearKeyPIN();
					};

					function reportUpdateStatus() {
						// Test Monitor
						var msgObj = {};
						msgObj.className = "dataMonitorMsg";
						msgObj.msg = "Updating Recording title: "
								+ assetInfo.title + ", id: " + assetInfo.id;
						reportActivity(msgObj);
						// Test Monitor------------------------------
					}

					function reportDeletion() {
						// Test Monitor
						var msgObj = {};
						msgObj.className = "dataMonitorMsg";
						msgObj.msg = "Deleting Recording title: "
								+ assetInfo.title + ", id: " + assetInfo.id;
						reportActivity(msgObj);
						// Test Monitor------------------------------
					}

					var errorDeleteCallback = function(data) {
						reportDeletion();
						informErrorActivity(data);
					};

					var deleteCallback = function(value, data) {
						reportDeletion();
						informSuccessActivity(data);
						if (value) {
							isRefresh_SR_PR = true;
							if (assetInfo.content_type
									&& assetInfo.content_type === "episode") {
								seriesSelected.episodes = _.without(
										seriesSelected.episodes, _.findWhere(
												seriesSelected.episodes, {
													id : assetInfo.id
												}));
								if (seriesSelected.episodes.length > 0) {
									refreshEpisodesList();
								}
							}
							refreshDeleted();
							backAction();
						}
					};

					function reportRestoring() {
						// Test Monitor
						var msgObj = {};
						msgObj.className = "dataMonitorMsg";
						msgObj.msg = "Restoring Recording title: "
								+ assetInfo.title + ", id: " + assetInfo.id;
						reportActivity(msgObj);
						// Test Monitor------------------------------
					}

					var errorRestoreCallback = function(data) {
						reportRestoring();
						informErrorActivity(data);
					};

					var restoreCallback = function(value, data) {
						reportRestoring();
						informSuccessActivity(data);
						if (value) {
							isRefresh_Deleted = true;
							refreshScheduleLatest()
							backAction();
						}
					};

					var eventBackUpdateStatusForDelete = function(that,
							itemList) {
						var responseItem = that.assetInfoResponse.info;
						if (responseItem) {
							if (assetInfo.status === responseItem.status.state) {
								assetInfo.recordingSetId = "personal";
								assetInfo.recordingSetType = "programs";  
								if (assetInfo.content_type == "episode") {
									if (assetInfo.type == "RECORDINGS") {
										deleteRecord(assetInfo, deleteCallback,
												errorDeleteCallback);
									} else {
										deleteRecord(assetInfo, deleteCallback,
												errorDeleteCallback);
									}
								} else {
									if (assetInfo.status === "RECEIVED"
											|| assetInfo.status === "SCHEDULED") {
										deleteRecord(assetInfo, deleteCallback,
												errorDeleteCallback);
									} else {
										deleteRecord(assetInfo, deleteCallback,
												errorDeleteCallback);
									}
								}
							} else {
								assetInfo.status = responseItem.status.state;
								if (assetInfo.status == "CAPTURING"
										|| assetInfo.status == "COMPLETED") {
									assetInfo.type = "RECORDINGS";
									refreshCTAInfoScreen(itemList);
								}
							}
						}
					};

					var eventBackUpdateStatusForRestore = function(that,
							itemList) {
						var responseItem = that.assetInfoResponse.info;
						if (responseItem) {
							informSuccessActivity(responseItem);
							if (assetInfo.status === responseItem.status.state) {
								restoreRecord(assetInfo, restoreCallback,
										errorRestoreCallback);
							}
						}
					};

					function keepforever(itemList) {
						var deferred = sendKeepforever(assetInfo);
						$.when(deferred).done(function(data) {
							addCheck();
						});
					}

					function reportGetMetadata() {
						// Test Monitor
						var msgObj = {};
						msgObj.className = "dataMonitorMsg";
						msgObj.msg = "Getting Program Metadata: " + assetInfo.episodeTitle + ", id: " + assetInfo.id;
						reportActivity(msgObj);
						// Test Monitor------------------------------
					}

					function getProgInfo(itemList, callback) {
						var deferred = getProgramInfo(itemList);
						$.when(deferred).done(function(data) {
							reportGetMetadata();
							if (data.ERROR) {
								informErrorActivity(data)
							} else {
								informSuccessActivity(data);
							}
							itemList.metadata = data;
							if (callback) {
								callback();
							}
						});
					}

					function delete_Item(itemList) {
						updateAssetStatus(assetInfo, eventBackUpdateStatusForDelete, itemList);
					}

					function restore_Item(itemList) {
						updateAssetStatus(assetInfo, eventBackUpdateStatusForRestore, itemList);
					}

					function cancel_Item(itemList) {
						updateAssetStatus(assetInfo, eventBackUpdateStatusForDelete, itemList);
					}

					function delete_Series(itemList) {
						deleteSeries(assetInfo, eventBackCancelOrDeleteSeries, itemList);
					}

					function cancel_Series(itemList) {
						cancelScheduleSeries(assetInfo,	eventBackCancelOrDeleteSeries, itemList);
					}
					
					function reSchedule(itemList) {
						reScheduleProgram(assetInfo, eventBackCancelOrDeleteSeries);
					}

					function option_Series(itemList) {
						recordingOptions(assetInfo);
					}

					function option_Recording(itemList) {
						recordingOptions(assetInfo);
					}

					function shareToFriend(itemList) {
						$('#friendsSearch').modal('show');
					}

					function recordingOptions(assetInfo) {
						window.scheduleOption_startOffset_index = _.indexOf(window.configGuide.ScheduleOptions[0].internalValues,assetInfo.options.startOffset);
						window.scheduleOption_endOffset_index = _.indexOf(window.configGuide.ScheduleOptions[1].internalValues,assetInfo.options.endOffset);
						window.scheduleOption_keep_index = _.indexOf(window.configGuide.ScheduleOptions[2].internalValues,assetInfo.options.spaceConflictPolicy);
						if (assetInfo.content_type === "SubscriberSeriesRecording") {
							window.scheduleOption_accept_index = _.indexOf(window.configGuide.ScheduleOptions[3].internalValues,assetInfo.options.accept);
							$('#labelOption').html("Series Options");
						}else{
							$('#labelOption').html("Recording Options")
						}
						createAssetOption(assetInfo.content_type);
						$('#modalSeriesOptions').modal('show');
					}

					function sendModifySeriesOptions() {
						var options = getOptions();
						$('#modalSeriesOptions').modal('hide');
						modifySeriesOptions(options);
						seriesActionFocus();
					}
					
					function sendModifyRecordingOptions() {
						var options = getOptions();
						$('#modalSeriesOptions').modal('hide');
						modifyRecordingOptions(options);
						seriesActionFocus();
					}

					function modifyRecordingOptions(options) {
						// Test Monitor
						var msgObj = {};
						msgObj.className = "dataMonitorMsg";
						msgObj.msg = "Modifiying Options for Asset type: " + assetInfo.ndvrType + ", id: " + assetInfo.id;
						reportActivity(msgObj);
						// Test Monitor------------------------------
						var userId = window.params.userSelected.id;
						var recordingSetId = "personal";
						var recordingSetType = "programs";  
						var deferred = modifyRecOptions(subscriberParam, userId, recordingSetType, recordingSetId, assetInfo.id, options);
						$.when(deferred).done(function(data) {
							if (data && data.ERROR) {
								informErrorActivity(data);
							} else {
								informSuccessActivity(data);
								updateOption(assetInfo.options, options);
							}
						});
					}
					
					function modifySeriesOptions(options) {
						// Test Monitor
						var msgObj = {};
						msgObj.className = "dataMonitorMsg";
						msgObj.msg = "Modifiying Options for Asset type: " + assetInfo.type + ", id: " + assetInfo.id;
						reportActivity(msgObj);
						// Test Monitor------------------------------
						var userId = window.params.userSelected.id;
						var deferred = sendSeriesOptions(subscriberParam, userId, assetInfo.id, options);
						$.when(deferred).done(function(data) {
							if (data && data.ERROR) {
								informErrorActivity(data);
							} else {
								informSuccessActivity(data);
								updateOption(assetInfo.options, options);
							}
						});
					}
					
					function updateOption(itemOptions, options){
						$.each( options, function( key, value ) {
							if(itemOptions[key]){
								itemOptions[key] = value;	
							}
					    });
					}
					
					function getOptions() {
						var options = {};
						options.spaceConflictPolicy = window.configGuide.ScheduleOptions[2].internalValues[window.scheduleOption_keep_index];
						if (assetInfo.status !== "CAPTURING"
								&& assetInfo.status !== "COMPLETED") {
							options.startOffset = window.configGuide.ScheduleOptions[0].internalValues[window.scheduleOption_startOffset_index];
						}
						if (assetInfo.status !== "COMPLETED") {
							options.endOffset = window.configGuide.ScheduleOptions[1].internalValues[window.scheduleOption_endOffset_index];
						}
						if (!assetInfo.ndvrType === "SubscriberEventRecording" || assetInfo.content_type==="SubscriberSeriesRecording") {
							options.accept = window.configGuide.ScheduleOptions[3].internalValues[window.scheduleOption_accept_index];
						}
						return options;
					}

					function createAssetOption(content_type) {
						$('#sendOptions').unbind();
						$('#sendDefault').unbind();
						var divContent = $('.modalContentOption');
						if (content_type === "SubscriberSeriesRecording") {
							var acceptInitialized = divContent.find("#"	+ window.configGuide.ScheduleOptions[3].title);
							if (acceptInitialized.length == 0) {
								divContent.attr("class", "modalContentOption");
								var row = $('<div/>');
								row.attr("id", "dinamicRow");
								row.attr("class", "row");

								var group = $('<div/>');
								group.attr("class", "form-group row");
								group.appendTo(row);
								var col1 = $('<div/>');
								col1.attr("class", "col-sm-4");
								col1.appendTo(group);
								var span1 = $('<span/>');
								span1.attr("class", "labelIncremental");
								span1.html(window.configGuide.ScheduleOptions[3].title);
								span1.appendTo(col1);
								var col2 = $('<div/>');
								col2.attr("class", "col-sm-10");
								col2.appendTo(group);
								var input = $('<input/>');
								input.attr("id",window.configGuide.ScheduleOptions[3].title);
								input.attr("type", "text");
								input.attr("value", "");
								input.attr("readonly", "readonly");
								input.attr("name",window.configGuide.ScheduleOptions[3].title);
								input.appendTo(col2);
								row.appendTo(divContent);
								$('.modalOption-content').css({
									"height" : "290px"
								});
							}

							$(
									"input[name='"
											+ window.configGuide.ScheduleOptions[3].title
											+ "']")
									.TouchSpin(
											{
												verticalbuttons : false,
												itemName : window.configGuide.ScheduleOptions[3].title,
												buttondown_class : 'increment_Button',
												buttonup_class : 'increment_Button',
												inputClass : 'inputSkin',
												initval : window.configGuide.ScheduleOptions[3].friendMsg[window.scheduleOption_accept_index],
												initIndex : window.scheduleOption_accept_index,
												min : window.configGuide.ScheduleOptions[3].friendMsg[0],
												arrayValue : window.configGuide.ScheduleOptions[3].friendMsg,
												max : window.configGuide.ScheduleOptions[3].friendMsg[window.configGuide.ScheduleOptions[3].friendMsg.length - 1]
											});
						} else {
							var dinamicRow = divContent.find("#dinamicRow");
							if (dinamicRow.length > 0) {
								dinamicRow.remove();
								$('.modalOption-content').css({
									"height" : "240px"
								});
							}
						}

						if (assetInfo.status === "CAPTURING") {
							disabledStartSpinin();
						} else if (assetInfo.status === "COMPLETED") {
							disabledStartSpinin();
							disabledEndSpinin();
						} else {
							$("input[name='Start']").prop('disabled', false);
							$("input[name='Start']").attr('class',
									'form-control inputSkin');
							$("span[id='Start']").attr('class',
									'labelIncremental');
						}
						$("input[name='Start']")
								.TouchSpin(
										{
											verticalbuttons : false,
											itemName : 'Start',
											buttondown_class : 'increment_Button',
											buttonup_class : 'increment_Button',
											inputClass : 'inputSkin',
											initval : window.configGuide.ScheduleOptions[0].friendMsg[window.scheduleOption_startOffset_index],
											initIndex : window.scheduleOption_startOffset_index,
											min : window.configGuide.ScheduleOptions[0].friendMsg[0],
											arrayValue : window.configGuide.ScheduleOptions[0].friendMsg,
											max : window.configGuide.ScheduleOptions[0].friendMsg[window.configGuide.ScheduleOptions[0].friendMsg.length - 1]
										});

						$("input[name='End']")
								.TouchSpin(
										{
											verticalbuttons : false,
											itemName : 'End',
											buttondown_class : 'increment_Button',
											buttonup_class : 'increment_Button',
											inputClass : 'inputSkin',
											initval : window.configGuide.ScheduleOptions[1].friendMsg[window.scheduleOption_endOffset_index],
											initIndex : window.scheduleOption_endOffset_index,
											min : window.configGuide.ScheduleOptions[1].friendMsg[0],
											arrayValue : window.configGuide.ScheduleOptions[1].friendMsg,
											max : window.configGuide.ScheduleOptions[1].friendMsg[window.configGuide.ScheduleOptions[1].friendMsg.length - 1]
										});

						$("input[name='Keep']")
								.TouchSpin(
										{
											verticalbuttons : false,
											itemName : 'Keep',
											buttondown_class : 'increment_Button',
											buttonup_class : 'increment_Button',
											inputClass : 'inputSkin',
											initval : window.configGuide.ScheduleOptions[2].friendMsg[window.scheduleOption_keep_index],
											initIndex : window.scheduleOption_keep_index,
											min : window.configGuide.ScheduleOptions[2].friendMsg[0],
											arrayValue : window.configGuide.ScheduleOptions[2].friendMsg,
											max : window.configGuide.ScheduleOptions[2].friendMsg[window.configGuide.ScheduleOptions[2].friendMsg.length - 1]
										});

						var divModal = $('.modalOption-content');
						var footerExist = divModal.find('#footer');
						if (footerExist.length > 0) {
							footerExist.remove();
						}
						var divFooter = $('<div/>');
						divFooter.attr('class', 'modalSeriesOptions-footer');
						divFooter.attr('id', 'footer');
						divFooter.appendTo(divModal);
						var buttonAccept = $('<button/>');
						buttonAccept.attr('class',
								'btn btn-default buttonModal');
						buttonAccept.html('Accept');
						buttonAccept
								.click(function(event) {
									event.stopPropagation();
									event.stopImmediatePropagation();
									if (assetInfo.content_type === "SubscriberSeriesRecording") {
										sendModifySeriesOptions();
										seriesActionFocus();
									} else {
										sendModifyRecordingOptions();
										recordingActionFocus();
									}
								});
						buttonAccept.appendTo(divFooter);
						var buttonClose = $('<button/>');
						buttonClose
								.attr('class', 'btn btn-default buttonModal');
						buttonClose.html('Close');
						buttonClose
								.click(function() {
									event.stopPropagation();
									event.stopImmediatePropagation();
									$('#modalSeriesOptions').modal('hide');
									if (assetInfo.content_type === "SubscriberSeriesRecording") {
										seriesActionFocus();
									} else {
										recordingActionFocus();
									}
								});
						buttonClose.appendTo(divFooter);
						var dinamicRowExist = $('#dinamicRow').length > 0;
						if (dinamicRowExist) {
							$('.modalSeriesOptions-footer').css({
								"margin-top" : "50px"
							});
						} else {
							$('.modalSeriesOptions-footer').css({
								"margin-top" : "0"
							});
						}
					}

					function disabledStartSpinin() {
						$("input[name='Start']").prop('disabled', true);
						$("input[name='Start']").attr('class',
								'form-control inputSkin disabled');
						$("span[id='Start']").attr('class',
								'labelIncremental disabled');
					}

					function disabledEndSpinin() {
						$("input[name='End']").prop('disabled', true);
						$("input[name='End']").attr('class',
								'form-control inputSkin disabled');
						$("span[id='End']").attr('class',
								'labelIncremental disabled');
					}

					var eventBackCancelOrDeleteSeries = function(that, itemList) {
						$('#infoListSeries .active').removeClass("active");
						backToMain();
					};

					var callbackPlayback = function() {
						if(window.programSelected.type === CONSTANTS.CATCHUP_TV_TYPE){
							window.activePlaybackSession.type = CONSTANTS.CATCHUP_TV_TYPE;
							window.activePlaybackSession.recordingSetId = window.programSelected.parent.id
						}
						createKeepAliveInterval();
						var url = assetInfo.playInfo.playbackUri;
						//url = "http://10.184.15.101:18082/9cad0c4619634de68a2550b76914c0ee.m3u8";

						if (url) {
							if (videoPlayerControls === undefined) {
								videoPlayerControls = new VideoPlayerControls();
								videoPlayerControls.init($('#videoContent'), url);
							} else {
								videoPlayerControls.video_url = url;
							}
							if (!jQuery.browser.mobile) {
								videoPlayerControls.playVideo();
							} else {
								location.href = 'playUrl?url_video=' + url;
							}
						}
					}

					function play_Item(item, callback) {
						if (!assetInfo.ndvr_url_playback) {
							getPlaybackSession(assetInfo, recordingConfig, callbackPlayback);
						}
					}

					function getPlaybackSession(item, recordingId, callback) {
						// Test Monitor
						var msgObj = {};
						msgObj.msg = "Playback program: " + item.metadata.title + ", airingId: " + item.metadata.airingId;
						msgObj.className = "dataMonitorMsg";
						reportActivity(msgObj);
						// Test Monitor------------------------------
						var jsonConfig = JSON.parse(recordingConfig);
						var device = getLocalStorageDevice();
						var user = getLocalStorageUser();
						var msg = {};
						msg.actionService = 'PLAYBACK';
						msg.subscriberName = (window.params && window.params.subscriberName)?window.params.subscriberName:subscriberParam;
						msg.userId = user.id;
						if(item.type === CONSTANTS.CATCHUP_TV_TYPE){
						  msg.recordingSetId = item.parent.id;
						  msg.type = item.type;
						  msg.recordingId = item.metadata.airingId;
						}else{
						  msg.recordingId = item.id;
						}
						msg.payload = {};
						if(device && device.id){
							msg.payload.deviceId = device.id;	
						}else{
							msg.payload.deviceId ="unknown";
						}
						if(item.bookmarkOffset){
							msg.payload.offset = item.bookmarkOffset;
						}
						msg = JSON.stringify(msg);
						
						$.ajax({
									type : "POST",
									url : "ServerService",
									contentType : 'application/json',
									mimeType : 'application/json',
									data : msg,
									async : false,
									success : function(data) {
										if (data && data.info.ERROR) {
											informErrorActivity(data.info);
										} else {
											var parseUrl = playbackUrl = data.info.playbackUri;
											assetInfo.playInfo = data.info;
											informSuccessActivity(data.info);
											window.activePlaybackSession = data.info;
											window.activePlaybackSession.subscriberName = window.params.subscriberName;
											window.activePlaybackSession.device = getLocalStorageDevice();
											window.programSelected = {};
											window.programSelected.start = item.referenceStartTimeStamp;
											window.programSelected.parent = item.parent;
											window.programSelected.end = item.referenceEndTimeStamp;
											window.programSelected.type = item.type;
											window.programSelected.metadata = {};
											window.programSelected.metadata.title = item.title;
											
											if (data.info.offset && data.info.offset > 0) {
												window.keepAliveFixedValue = true;
												window.activePlaybackSession.timeElapsed = window.activePlaybackSession.offset;
												createResumeDialog(window.activePlaybackSession.timeElapsed, playbackUrl, window.programSelected);
											} else {
												window.keepAliveFixedValue = false;
												window.activePlaybackSession.timeElapsed = 0;
												if (callback) {
													callback();
												}
											}
										}

									}
								});
					}

					function createResumeDialog(valueWatched, playbackUrl,	program) {
						var totalMinutes = getRecordingDuration(program.start,	program.end);
						var timeWatched = getMinutesWatched(valueWatched);
						var timeInMinutes = getTimeInMin(valueWatched);
						var percentage = (timeInMinutes * 100) / totalMinutes;
						var result = percentage.toFixed(1);
						var progressBarResume = $('#modalResumeAt').find('#progressBarResume');
						progressBarResume.attr('aria-valuenow', result);
						progressBarResume.attr('style', "width:" + result + "%");
						var totalVideo = $('#totalTime');
						var totalToShow = getTotalTime(totalMinutes * 60);
						totalVideo.html(totalToShow);
						var totalWatched = $('#watched');
						totalWatched.html(timeWatched);
						var buttonResume = $('#resumeVideo');
						buttonResume.bind('click', function() {
							window.keepAliveFixedValue = false;
							$('#modalResumeAt').modal('hide');
							callbackPlayback();
						});
						var buttonRestart = $('#restartViedo');
						buttonRestart.bind('click', function() {
							window.activePlaybackSession.timeElapsed = 0;
							window.keepAliveFixedValue = false;
							$('#modalResumeAt').modal('hide');
							callbackPlayback();
						});
						$('#modalResumeAt').modal('show');
					}

					var callbackStopEvent = function(that, listItem, data) {
						reportStopping();
						informSuccessActivity(data);
						assetInfo.status = "COMPLETED";
						assetInfo.type = "RECORDINGS";
						refreshCTAInfoScreen(listItem);
					};

					function reportStopping() {
						// Test Monitor
						var msgObj = {};
						msgObj.className = "dataMonitorMsg";
						msgObj.msg = "Stoping Recording title: " + assetInfo.title + ", id: " + assetInfo.id;
						reportActivity(msgObj);
						// Test Monitor------------------------------
					}

					var errorCallbackStopEvent = function(data) {
						reportStopping();
						informErrorActivity(data);
					};

					var eventBackUpdateStatusCapturing = function(that,	listItem) {
						var responseItem = that.assetInfoResponse.info;
						if (responseItem) {
							if (assetInfo.status === responseItem.status.state) {
								assetInfo.recordingSetId = "personal";
								assetInfo.recordingSetType = "programs";  
								sendStopRecording(assetInfo, callbackStopEvent,
										listItem, errorCallbackStopEvent);
							} else {
								assetInfo.status = responseItem.status.state;
								if (assetInfo.status == "COMPLETED"	|| assetInfo.status === "CAPTURING") {
									assetInfo.type = "RECORDINGS";
									refreshCTAInfoScreen(listItem);
								}
							}
						}
					};

					function stop_Item(itemList) {
						updateAssetStatus(assetInfo,
								eventBackUpdateStatusCapturing, itemList);
					}

					function moreLikeThis() {
						var jsonConfig = JSON.parse(recordingConfig);
						var subscriber = jsonConfig.RecordingsSchedules.subscriber;
						window.location = "./ondemand.html?"
								+ "correlation_id=" + assetInfo.programId
								+ "&from=ndvr&subscriberName=" + subscriber;
					}

					function updateInfoListItem(listItem, uiInfoUpdate) {
						listItem.html(uiInfoUpdate.title);
						listItem.attr('action', uiInfoUpdate.action);
					}

					var infoMenuItemActionEvent = function(e, $item) {
						var fn = $item.attr('action');
						lastFocused = $item;
						var itemFound;
						switch (fn) {
						case 'keepforever':
							keepforever($item);
							break;
						case 'delete':
							delete_Item($item);
							break;
						case 'restore':
							restore_Item($item);
							break;
						case 'cancel':
							cancel_Item($item);
							break;
						case 'play':
							play_Item(itemFound);
							break;
						case 'close':
							backAction(itemFound);
							break;
						case 'stop':
							stop_Item($item);
							break;
						case 'more':
							moreLikeThis();
							break;
						case 'cancel_series':
							cancel_Series($item);
							break;
						case 'delete_series':
							delete_Series($item);
							break;
						case 'option_series':
							option_Series($item);
							break;
						case 'option_recording':
							option_Recording($item);
							break;
						case 'reschedule':
							reSchedule($item);
							break;
						case 'backRecordingSet':
							backCatchupProgScreen($item);
							break;
						case 'shareTo':
							shareToFriend($item);
							break;
						default:
							break;
						}

					};

					function refreshEpisodesList() {
						var cont = $('#episodeList').empty();
						renderSeriesInfo(seriesSelected);
					}

					function backAction() {
						if (assetInfo.content_type	&& assetInfo.content_type === "episode") {
							if (seriesSelected.episodes.length > 0) {
								assetInfo = seriesSelected;
								infoScreenSelect();
							} else {
								backToMain();
							}
						} else {
							if (assetInfo.content_type == "SubscriberSeriesRecording" || assetInfo.content_type == "episode") {
								$('#infoListSeries .active').removeClass("active");
							}
							backToMain();
						}
						$('#infoBgImage .infoitemImg').attr('src', '');
					}

					function backToMain() {

						isNeedsRefresh();
						$('#infoNdvrPage').hide();
						$('#infoSeriesNdvrPage').hide();
						$('#videoStream').hide();
						$('#videoContainer').hide();
						$('#videoContent').hide();
						$('#mainNdvrPage').show();
						$('#producersCrew').text('');
						$('.producers-info').hide();
						$('#castCrew').text('');
						$('.cast-info').hide();
						scroller.scrollToCurrentPosition();// fix because
															// espial goes to
															// scroll 0
						$('#infoListOptions').empty();
						assetInfo = null;
						seriesSelected = null;
						addNdvrClearKeyPIN();

					}

					function isNeedsRefresh() {
						if (pendingRefreshCatchUp) {
							isRefresh_TSR = true;
							refreshCatchUp(resetIntervalRefreshCatchUp);
						}
						if (pendingRefreshDeleted || lastNavFocusPosition === 3) {
							isRefresh_Deleted = true;
							refreshDeleted(resetIntervalRefreshDeleted);
							setTimeout(function() {
								lastFocusedMainPage.click();
							}, 60);

						}
						if (pendingRefresh
								|| (lastNavFocusPosition > 0 && lastNavFocusPosition < 3)) {
							isRefresh_SR_PR = true;
							refreshMainPage(resetIntervalRefresh);
							setTimeout(function() {
								lastFocusedMainPage.click();
							}, 60);

						} else {
							setTimeout(function() {
								lastFocusedMainPage.click();
							}, 60);
						}

					}

					function refreshScheduleLatest() {
						pendingRefresh = true;
						isNeedsRefresh();
					}

					function refreshDeleted() {
						pendingRefreshDeleted = true
						isNeedsRefresh();
					}

					createInfoMenuItems = function() {
						var ul = $('#infoListOptions');
						if ($('#infoListOptions').children().length < 1) {
							var configMenuItems = jQuery.extend(true, {},
									config.config_ui.infoScreenConfig.menuItem);
							var menuItemsArray = [];

							for ( var key in configMenuItems) {

								if (configMenuItems[key].type === assetInfo.status) {
									var optionsArray = configMenuItems[key].menuActions;
									menuItemsArray = optionsArray;
								}

							}

							setMenuAction();

							$
									.each(
											menuItemsArray,
											function(i, item) {
												var li = $('<li/>')
														.addClass(
																'infoOptionsAssetMenu action-menu')
														.attr('action',
																item.action)
														.bind('eventEnter',
																infoMenuItemActionEvent)
														.bind('eventBack',
																backAction)
														.bind(
																'noMoreItemsLeft',
																backAction)
														.html(item.title)
														.appendTo(ul);
												if (assetInfo.keepforever) {
													if (li.attr('action') === "keepforever") {
														var checkContainer = jQuery(
																'<div/>',
																{
																	"class" : "checkContainer",
																	"style" : "display: inline;"
																});
														var img = jQuery(
																'<img/>',
																{
																	"class" : "img-responsive checkIcon",
																	"src" : './css/images/button-check.png'
																});
														checkContainer
																.append(img);
														li
																.append(checkContainer);
													}
												}
											});

							$('#infoListOptions li').keynavigator();
						}
						$('#infoListOptions li').first().addClass('active').click();

					};

					function refreshCTAInfoScreen(lastItemFocused) {
						var ul = $('#infoListOptions');
						ul.empty();
						if (ul.children().length < 1) {
							var configMenuItems = jQuery.extend(true, {},
									config.config_ui.infoScreenConfig.menuItem);
							var menuItemsArray = [];

							for ( var key in configMenuItems) {

								if (configMenuItems[key].type == assetInfo.status) {
									var optionsArray = configMenuItems[key].menuActions;
									if (assetInfo.status === "COMPLETED") {
										optionsArray = _.without(optionsArray,
												_.findWhere(optionsArray, {
													title : "Stop"
												}));
									}
									menuItemsArray = optionsArray;
								}

							}

							setMenuAction();

							$.each(menuItemsArray, function(i, item) {
								var li = $('<li/>').addClass(
										'infoOptionsAssetMenu action-menu')
										.attr('action', item.action).bind(
												'eventEnter',
												infoMenuItemActionEvent).bind(
												'eventBack', backAction).html(
												item.title).appendTo(ul);
							});

							$('#infoListOptions li').keynavigator();

						}
						if (lastItemFocused.attr('action') === "delete"
								|| lastItemFocused.attr('action') === "stop") {
							$.each(ul.children(), function(i, item) {
								if ($(item).attr('action') === "delete"
										|| $(item).attr('action') === "stop") {
									$(item).click();
									return false;
								}

							});
						}
					}

					var noMoreItemsRight = function(e, item) {

					};

					var noMoreItemsLeft = function(e, item) {

						scroller.reset();
						isFullScreenPosters = false;
						$('#navBarContainer').velocity({
							'margin-left' : '0'
						}, 200);

						$('#ndvrContainer').velocity({
							'width' : '860px',
							'padding-top' : '15px',
							'padding-right' : '20px',
							'padding-bottom' : '6px',
							'padding-left' : '20px'
						}, {
							complete : function() {

							}
						}, 200);

						// get the active element position
						posterFocusPosition = $('#scrollContainer').find(
								'.active').index();
						$('#scrollContainer').find('.active').removeClass(
								'active');

						settleFocusState('#navContent', 'li',
								leftNavFocusPosition);

						clearNamingPath();

					};

					var focusElement = function(e, item) {
						lastFocused = item.addClass('focused');
					};

					function checkIsVisible(containerScroll, elem) {
						var TopView = containerScroll.scrollTop();
						var BotView = TopView + containerScroll.height();
						var TopElement = elem.offset().top;
						var BotElement = TopElement + elem.height();
						return ((BotElement <= BotView) && (TopElement >= TopView));
					}

					var checkScrollMoreItemsEvent = function(e, item) {
						scroller.checkVisibleRows(item, item.callBack);
					};

					var isLastRowEvent = function(e, item) {
						var indexElem = item.ele.index();
						var currentItemsCount = currentItems.length;
						var rowsValue = currentItemsCount
								/ scroller.items_per_row;
						var integerRow = Math.floor(rowsValue);
						if ((rowsValue % 1) > 0
								&& scroller.currentRow !== integerRow
								&& scroller.maxVisibleRowIndex === scroller.currentRow) {
							item.cel++;
							scroller.checkVisibleRows(item, item.callBack);
							scroller.container.children().last().click();
						} else {
							item.callBack();
						}

					};

					$('#scrollContainer').on('keyup', function(e) {
						var k = e.keyCode;
						if (k > 36 && k < 41) {
						}
					});

					renderItem = function(content, item) {

						var content_type = item.content_type;
						var scrollContainer = $(content).find(
								'.scrollContainer');

						var spanHolderTitle = jQuery('<span/>', {
							"class" : "itemTitleHolderSpan"
						});

						var divHolderTitle = jQuery('<div/>', {
							"class" : "itemTitleHolderDiv"
						});

						
						if (content_type === CONSTANTS.SUBSCRIBER_SERIES_RECORDING
								|| content_type === CONSTANTS.CATCHUP_CONTENT_TYPE) {
							divHolderTitle.addClass('stack-holder');
						}

						var divSeries = jQuery('<div/>', {
							"class" : "img-stack"
						});

						var uriImg = item.url_img_poster;
						var imgElement = undefined;
						var onEnter = eventEnterItem;
						
						if(content_type === CONSTANTS.CATCHUP_CONTENT_TYPE){
							onEnter = eventEnterCatchUpItem;
						}
						
						if(content_type === CONSTANTS.SUBSCRIBER_SERIES_RECORDING){
							onEnter = eventEnterSeriesItem;
						}
						
						if (content_type === CONSTANTS.SUBSCRIBER_SERIES_RECORDING && item.episodes.length > 0) {
							imgElement = renderPoster(item.episodes[0].programId, divHolderTitle);
							spanHolderTitle.html(item.episodes[0].title).appendTo(divHolderTitle);
						} else {
							imgElement = renderPoster(item.programId, divHolderTitle);
							spanHolderTitle.html(item.title).appendTo(divHolderTitle);
						}
						
						
						if(content_type === "VOD" && hasBookmark(item)){
							addPlaybackProgressOnVOD(divHolderTitle, item.bookmarkOffset, item.progdurationInSec);
						}
						
						var itemTitleDiv = jQuery('<div/>', {
							"class" : "itemTitleDiv"
						});

						var divItem = jQuery('<div/>', {
							"class" : "col-md-3 item",
							id : item.id,
							type : item.type,
							content_type : item.content_type,
							"style" : "display: none;"
						}).bind('eventEnter', onEnter).bind('eventBack',
								noMoreItemsLeft).bind('noMoreItemsRight',
								noMoreItemsRight).bind('noMoreItemsLeft',
								noMoreItemsLeft).bind('scrollCheckEvent',
								checkScrollMoreItemsEvent).bind(
								'isLastRowEvent', isLastRowEvent);

						var posterTitle = jQuery('<span/>', {
							"class" : "activeTitle"
						}).html(item.title).appendTo(divItem);
						
						if(content_type === "VOD" && hasBookmark(item)){
							addPlaybackProgressOnVOD(divItem, item.bookmarkOffset, item.progdurationInSec);
						}

						var redDot = undefined;
						var errorWarning = undefined;

						if (item.status === "ERROR") {
							errorWarning = $('<img/>');
							errorWarning.attr('src',
									"css/images/errorRequest.png");
							errorWarning.attr('class', 'infoGeneralError');
							errorWarning.appendTo(divItem);
						} else {
							redDot = jQuery('<span/>', {
								"class" : "infoGeneralRedDot"
							}).html("&nbsp;&nbsp;&nbsp;&nbsp;").appendTo(
									divItem);
						}

						if (content_type === CONSTANTS.SUBSCRIBER_SERIES_RECORDING) {

							var seriesNumber = jQuery('<div/>', {
								"class" : "series-number"
							}).html(item.episodes.length);
							divItem.appendTo(scrollContainer).prepend(
									imgElement).prepend(divSeries).prepend(
									seriesNumber).append(divHolderTitle);
							
						}else if(content_type === CONSTANTS.CATCHUP_CONTENT_TYPE){
							var name = truncateText(item.name, 15);
							var recordingSetName= jQuery('<div/>', {"class" : "recordingSet-name"}).html(name);
								divItem.appendTo(scrollContainer)
								.prepend(imgElement).prepend(divSeries)
								.prepend(recordingSetName)
								.append(divHolderTitle);
						}else {
							divItem.appendTo(scrollContainer).prepend(imgElement).append(divHolderTitle);
						}

						divItem.fadeIn(700);
						
						if (item.status === "ERROR") {
							errorWarning.show();
						} else if (item.status === "CAPTURING") {
							redDot.show();
						} else {
							redDot.hide();
						}
					};
					
					function renderPoster(programId, divHolderTitle) {
						var poster = jQuery('<img/>', {

							"class" : "img-responsive itemImg",
							"src" : 'posterImage/' + programId + '.jpg'

						}).load(function() {
							console.log('load');
							divHolderTitle.remove();
							$(this).fadeIn(700);

						}).error(
								function() {
									console.log('Error');
									$(this).unbind('error');
									poster = renderPosterRetry($(this),
											programId, divHolderTitle);

								});

						return poster;
					}

					function renderPosterRetry(element, programId,
							divHolderTitle) {
						var url = config.config_ui.imageServer.replace(
								"{programId}", programId);
						element.attr('src', url).error(function() {
							console.log('retry Error');
							element.remove();
						});

						return element;
					}

					function checklength(str, limit) {

						if (str !== null && str.length && str.length > limit) {

							str = str.slice(0, limit);
							str += '...';

						}

						return str;

					}

					function setActions(title, action) {
						var obj = {};
						obj.title = title;
						obj.action = action;
						return obj;
					}

					function setMenuAction() {
						if (assetInfo.status == "CAPTURING") {
							$('.infoRedDot').show();
						} else {
							$('.infoRedDot').hide();
						}
					}

					function showAssetInfo(item) {
						var itemTitle;
						if (item.type === "episode") {
							itemTitle = item.episodeTitle;
						} else {
							var itemTitle = item.title;
						}
						var itemRate = item.metadata.metadata.ratings;
						var itemSinopsys = undefined;
						if (item.metadata.metadata.program.description) {
							itemSinopsys = item.metadata.metadata.program.description.en;
						}
						var itemImgTitle = item.title;
						var itemSrcImgPoster = item.url_img_poster;
						var imgChannelLogo = item.img_channel_logo;
						var channelNumber = item.metadata.channel.id;
						var itemDate = item.dateUnderPoster;
						var itemStartDate = item.timeUnderPosterStart;
						var itemEndDate = item.timeUnderPosterEnd;
						var itemAirDate = item.metadata.metadata.program.originalAirDate;
						var itemProducers = item.metadata.producers;
						var itemCast = item.metadata.metadata.program.cast;

						function getNames(array) {

							var names = '';
							var temp;

							for ( var key in array) {
								names += array[key].firstName + ", "
										+ array[key].lastName + "; ";
							}

							names = names.substring(0, names.length - 2);

							return names;

						}

						if (item.producers) {
							$('.producers-info').show();
							$('#producersCrew').text(getNames(itemProducers))
						}

						if (itemCast) {
							$('.cast-info').show();
							$('#castCrew').text(getNames(itemCast))
						}

						if (item.type === "SubscriberSeriesRecording") {
							$('#airDateLabel').hide();
						} else {
							$('#airDateLabel').html("Original Air Date:").show();
						}

						itemTitle ? $('.infoMainTitle').html(itemTitle).show() : $('.infoMainTitle').hide();
						itemSinopsys ? $('#infoSinopsys').html(checklength(itemSinopsys, 625)).show() : $('#infoSinopsys').hide();
						itemImgTitle ? $('#infoImgTitle').html(itemImgTitle): $('#infoImgTitle').hide();
						itemRate && itemRate[0] ? $('#infoTvRating').html(itemRate[0].value).show() : $('.infoTvRatingContainer').hide();
						loadPosterAsync('.infoitemImg', item.programId);
						
						var playbackProgressContainer = $('#assetMetadataInfo');
						if((item.content_type === "VOD" || item.content_type === "episode") && hasBookmark(item)){
							addPlaybackProgressOnAssetInfo(playbackProgressContainer, item.bookmarkOffset, item.progdurationInSec);
						}else{
							$('#playbackProgress').remove();
						}
						addStatusIconOnPoster(item.status, assetMetadataInfo);
						loadChannelIconAsync('.itemChnLogo', item.channelId);
						itemDate ? $('.infoRecDate').html(itemDate).show() : $('.infoRecDate').hide();
						channelNumber ? $('#infoChnNumber').html(channelNumber).show() : $('#infoChnNumber').hide();
						itemAirDate ? $('#infoAirDate').html(itemAirDate).show() : $('#infoAirDate').hide();

						if (itemStartDate || itemEndDate) {
							$('#infoHoursDate').html(itemStartDate + ' - ' + itemEndDate).show();
						} else {
							$('#infoHoursDate').hide();
						}

					}

					function settleFocusState(cont, el, lastActiveItem) {

						var elArray = $(cont).find(el);

						if (lastActiveItem > elArray.length) {
							lastActiveItem = 0;
						}

						var activeElement = $(elArray).eq(lastActiveItem || 0);

						activeElement.addClass('active').click();
					}

					function setHeaderNaming(index) {

						clearNamingPath();
						var name = $('#navContent li').eq(index).text();
						$('#headerTitle')
								.addClass('activeHeader addBar')
								.after('<p class="namingPath">' + name + '</p>');
						$('.headerBackLabel').removeClass('hide');
						$('.headerOptionsLabel').addClass('hide');

					}

					function clearNamingPath() {
						$('.rowTitle .title')
								.removeClass('activeHeader addBar');
						$('.namingPath').remove();
						$('.headerBackLabel').addClass('hide');
						$('.headerOptionsLabel').removeClass('hide');
					}

					function getTvRating(intValueRating) {
						var configRatings = config_tv_ratings.tv_ratings;
						for ( var key in configRatings) {
							if (configRatings[key].value == intValueRating) {
								return configRatings[key].title;
							}
						}
					}
				}).bind(this);