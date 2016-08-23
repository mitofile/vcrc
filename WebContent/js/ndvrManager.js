this.ndvrRecords = [];
this.ndvrSeries = [];
this.assetInfo = null;
this.seriesSelected = null;
this.recordingSetSelected = null;
this.assetInfoResponse = null;
this.deleteResult = false;

var CONSTANTS = {
	'LOCAL_STORAGE_SUBSCRIBER_NAME_VOLATILE': 'subscriberNameVolatile',
	'LOCAL_STORAGE_SUBSCRIBER_NAME': 'rememberSubscriberName',
	'LOCAL_STORAGE_SUBSCRIBER': 'rememberSubscriber',
	'LOCAL_STORAGE_DEVICE':'rememberDeviceSelected',
	'LOCAL_STORAGE_USER':'rememberUserSelected',
	'ALERT_INFO' : 'alert alert-info alertEach',
	'ALERT_SUCCESS' : 'alert alert-success alertEach',
	'ALERT_WARNING' : 'alert alert-warning alertEach',
	'ALERT_DANGER' : 'alert alert-danger alertEach',
	'LOCAL_STORAGE_SUBSCRIBER_FAV_CH': 'subscriberFavChannels',
	'CATCHUP_CONTENT_TYPE' : 'RECORDING_SET',
	'SUBSCRIBER_SERIES_RECORDING' : 'SubscriberSeriesRecording',
	'CATCHUP_TV_TYPE' : 'CATCHUP_TV',
	'SCOPE_PUBLIC' : 'PUBLIC',
	'STATUS_ERROR' : 'ERROR',
	'STATUS_CONFLICT' : 'CONFLICT',
	'TRICK_PLAY_EVENT_PAUSE' : 'PAUSE',
	'FEATURE_CATCH_UP' : 'CATCH_UP',
	'FEATURE_START_OVER' : 'START_OVER',
	'FEATURE_PAUSE_LIVE_TV' : 'PAUSE_LIVE_TV',
	'MENU_OPTION_ON_PAST' : 'past',
	'MENU_OPTION_ON_NOW' : 'now',
	'MENU_OPTION_ON_FUTURE' : 'future',
	'MENU_OPTION_ONLY_FOR_NOT_PLAYING' : 'notPlaying',
	'MENU_OPTION_ONLY_FOR_SERIES' : 'series'
};

function parseResponse(response, type) {
	this.ndvrRecords = [];
	var that = this;
	var playback = "";
	$.each(response[type], function(key, value) {
		var isValid = false;
		switch (type) {
		case "Recordings":
			isValid = (value.status.state === "CAPTURING" || value.status.state === "COMPLETED");
			break;
		case "Schedules":
			isValid = (value.status.state === "SCHEDULED"); 
			break;
		case "DELETED":
			isValid = (value.status.state === "DELETED"); 
			break;
		default:
			break;
		}		
		if(isValid){
			var objR = createNDVRRecord(value, type);
			that.ndvrRecords.push(objR);
		}
		
	});

	//orderEpisodes();
	return this.ndvrRecords;
}

function createNDVRRecord(value, type){
	var metadata ={};
	var id = value.id;
	var bookmarkOffset = value.bookmarkOffset;
	var ndvrType = value.type;
	var hash = value.itemHash;
	var programUrl = value.program;
	var programId = value.programId;
	var channelId = value.channelId;
	var episodeTitle = (value.episodeTitle)?value.episodeTitle:value.title;
	var poster = undefined;
	if(value.poster){
		poster = value.poster;
	}else{
		poster = "./posterImage/" + programId + ".jpg";	
	}
	var channelImage = "./channelLogo/" + channelId + ".png";
	var posterArtUrl = value.posterArtUrl;
	var channelIcoUrl = value.channelIconUrl;
	
	var susbscriber = value.user;
	var airingId = value.airingId;
	var title = value.title;
	//Recording options
	var options = value.options;
	if(options){
		options.endOffset = options.endOffset + ".0";
		options.startOffset = options.startOffset + ".0";
	}
	var dateStartTime = getTimeStamp(value.eventStart);
	var programStartTime = dateStartTime;
	var showBeggining = getTimeStamp(value.eventStart, true);
	var dateEndTime = getTimeStamp(value.eventEnd);
	var programEndTime = dateEndTime;
	var recordingStartDate = value.eventStart;
	var recordingEndDate = value.eventEnd;
	var referenceStartDate = value.effectiveStart;
	var referenceEndDate = value.effectiveEnd;
	var programStartDate = value.eventStart;
	var programEndDate = value.eventEnd;
	
	var recordingStartTimeStamp = getTimeStamp(recordingStartDate);
	var recordingEndTimeStamp = getTimeStamp(recordingEndDate);
	var referenceStartTimeStamp = getTimeStamp(referenceStartDate);
	var referenceEndTimeStamp = getTimeStamp(referenceEndDate);
	var programStartTimeStamp = getTimeStamp(programStartDate);
	var programEndTimeStamp = getTimeStamp(programEndDate);
	var duration_playback = getDiffTimeStamp(referenceStartTimeStamp,referenceEndTimeStamp);
	var duration_program = getDiffTimeStamp(programStartTimeStamp, programEndTimeStamp);
	var offset_playback_duration = getDiffTimeStamp(recordingStartTimeStamp, referenceStartTimeStamp);
	var offset_playback_bar = getDiffTimeStamp(programStartTimeStamp , referenceStartTimeStamp);
	var progdurationInSec = getDiffInSec(referenceStartTimeStamp,referenceEndTimeStamp); 

	metadata.rate = undefined;
	metadata.sinopsys = undefined;
	metadata.producers = undefined;
	metadata.cast = undefined;
	metadata.original_air_date = undefined;
	metadata.year = undefined;
	metadata.channelNumber = undefined;
	
	if(metadata.original_air_date && metadata.original_air_date.length > 0){
		metadata.air_date = getTimeStamp(original_air_date);
	}else{
		metadata.air_date = value.eventStart
	}
	
	var playbackUrl = value.playbackUrl;
	var status = value.status.state;	
	var keepforever = undefined;
	var parent = value.parent;
	
	return new NDVRRecord(id, bookmarkOffset, ndvrType, hash, programUrl, poster, channelImage, programId, programStartTime, showBeggining, programEndTime, referenceStartTimeStamp, referenceEndTimeStamp, susbscriber, title, recordingStartDate, recordingEndDate, duration_playback, duration_program,offset_playback_duration , offset_playback_bar, progdurationInSec, playbackUrl, channelId, status, type,"VOD" , airingId, keepforever, metadata, parent, episodeTitle, options);
}


function parseSeriesResponse(response){
	var seriesSetCollection = [];
	if(response.series && response.series.entities && response.series.entities.length > 0){
		seriesSetCollection = addSeriesSet(response.series.entities);
	}
    return seriesSetCollection;
}

function parseCatchupResponse(response){
	var catchupSets = [];
	if(response.CATCHUP_TV.entities){
		catchupSets = addCatchupSets(response.CATCHUP_TV.entities);
	}
	return catchupSets;
}

//function orderEpisodes(){
//	$.each(ndvrSeries, function(key, value) {
//		var episodes = findEpisodes(value.id, ndvrRecords);
//		if(value.type ==="RECORDINGS"  && episodes.length===0){
//			ndvrRecords = _.difference(ndvrRecords, value);
//		}else{
//			var arrayDiff = _.difference(ndvrRecords, episodes);
//			value.episodes = episodes;
//			ndvrRecords = arrayDiff;
//		}
//	});
//}

//function findEpisodes(seriesId, ndvrRecords){
//	var episodes = _.filter(ndvrRecords, function(obj) {
//		if(obj.ndvrType=="SubscriberEventRecording" && obj.parent){
//			 obj.content_type = "episode";
//			 return obj.parent.id == seriesId;
//		}else{
//			return false;
//		}
//	});
//	return episodes;
//}


function isSeriesAdded(idSeries){
	var found = false;
	$.each(this.ndvrSeries, function(key, value) {
		if(value.id === idSeries ){
			found = value;
			return;
		}
	});
	return found;
	
}

function addCatchupSets(response){
	var ndvrCatchup = [];
	$.each(response, function(key, value) {
		var catchupSet = new NdvrCatchup(value);
		ndvrCatchup.push(catchupSet);
	});
	return ndvrCatchup;
}

function addSeriesSet(seriesSetCollection){
	var ndvrSeries = [];
	$.each(seriesSetCollection, function(key, series){
		var episodes = [];
		var seriesItem = new NdvrSeries(series.id, series.seriesId, series.status, series.name, series.poster, series.type, series.options);
		if(series.recordings){
			$.each(series.recordings, function(key, recording){
				var ndvrRecording = createNDVRRecord(recording, "episode");
				episodes.push(ndvrRecording);
			});
		}
		seriesItem.episodes = episodes;
		ndvrSeries.push(seriesItem);
	});
	return ndvrSeries;
}



function getSubChannelArray(){
	var channelObjArray = [];
	var channeluniques = [];
	if(window.params.subscriber){
		channeluniques = _.chain(window.params.subscriber.channels).pluck('channels').flatten().uniq().value();
	}
	
	return channeluniques;
}


function removeInvalidCatchup(ndvrCatchups){
	var validCatchups = [];
	$.each(ndvrCatchups, function(key, catchupElement) {
		if(catchupElement.scope === CONSTANTS.SCOPE_PUBLIC){
			validCatchups.push(catchupElement);	
		}
	});
	return validCatchups;
}

function getRecordingSetChildren(recordingSet, callback){
	// Test Monitor
	var msgObj = {};
	msgObj.className = "dataMonitorMsg";
	msgObj.msg = "Getting RecordingSet programs. RecordingSet Id: " + recordingSet.id;
	reportActivity(msgObj);
	// Test Monitor------------------------------
	var async = true;
	var deferred = getCatchupPrograms(async, subscriberParam, recordingSet);
	$.when(deferred).done(function(data) {
		if (data.info && data.info.ERROR) {
			informErrorActivity(data.info);
		} else {
			informSuccessActivity(data.info);
			var programs = filterProgramsByStatus('COMPLETED', data.info.entities);
			programs = addFormatedDate(programs);
			
			recordingSet.programs = programs;
			(callback || _.noop)();
		}
	});
}


function notifyTrickPlayEvent(trickPlayEventAction, sessionObj, offset, callback){
	// Test Monitor
	var msgObj = {};
	msgObj.className = "dataMonitorMsg";
	msgObj.msg = "Sending trickPlay event name: " + trickPlayEventAction;
	reportActivity(msgObj);
	// Test Monitor------------------------------
	var trickPlayObject = {};
	trickPlayObject.subscriberName = window.activePlaybackSession.subscriberId;
	trickPlayObject.sessionId = sessionObj.sessionId;
	trickPlayObject.recordingId = sessionObj.recordingId;
	trickPlayObject.payload = {};
	trickPlayObject.payload.eventType = trickPlayEventAction;
	trickPlayObject.payload.deviceId = sessionObj.device.id;
	trickPlayObject.payload.deviceType = sessionObj.device.type
	trickPlayObject.payload.data = {};
	trickPlayObject.payload.data.offset = offset;
	var deferred = sendTrickPlayEvent(trickPlayObject);
	$.when(deferred).done(function(data) {
		if (data.info && data.info.ERROR) {
			informErrorActivity(data.info);
		} else {
			informSuccessActivity(data.info);
			var programs = filterProgramsByStatus('COMPLETED', data.info.entities);
			programs = addFormatedDate(programs);
			
			recordingSet.programs = programs;
			(callback || _.noop)();
		}
	});
}


function getTimeStamp(dateStr, offsetVal) {
	var date = new Date(dateStr);
	return date.getTime() + (date.getTimezoneOffset() * 60000)	
}

function getDiffInSec(startTimeStamp, endTimeStamp){
	var difference = endTimeStamp - startTimeStamp;
	return  Math.floor(difference / 1000);
}

function getPercentageElapsed(duration, elapsed){
	return Math.floor((elapsed * 100)/duration);
}

function getDiffTimeStamp(startTimeStamp, endTimeStamp) {
	var difference = endTimeStamp - startTimeStamp;

	var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
	difference -= daysDifference * 1000 * 60 * 60 * 24

	var hoursDifference = Math.floor(difference / 1000 / 60 / 60);
	difference -= hoursDifference * 1000 * 60 * 60

	var minutesDifference = Math.floor(difference / 1000 / 60);
	difference -= minutesDifference * 1000 * 60

	var secondsDifference = Math.floor(difference / 1000);

	return {days:daysDifference,
			hours: hoursDifference,
			min:minutesDifference,
			sec:secondsDifference};
}

function modifyRecOptions(subscriber, userId, recordingSetType, recordingSetId, recordingId, options, async) {
	  if(async === undefined){
	    async = true;
	  }else{
		  async = false;  
	  }
	  var requestInfo ={};
	  requestInfo.actionService = "REC_PREFERENCES";
	  requestInfo.subscriberName = subscriber;
	  requestInfo.userId = userId;
	  requestInfo.recordingSetType = recordingSetType;
	  requestInfo.recordingSetId = recordingSetId;
	  requestInfo.options = options;
	  requestInfo.recordingId = recordingId;
	  var msg = JSON.stringify(requestInfo);
	  return $.ajax({
	    async : async,
	    type : "POST",
	    url : "ServerService",
	    contentType : 'application/json',
	    mimeType : 'application/json',
	    data : msg
	  });
}

function sendSeriesOptions(subscriber, userId, recordingSetId, options, async) {
	  if(async === undefined){
	    async = true;
	  }else{
		  async = false;  
	  }
	  var requestInfo ={};
	  requestInfo.actionService = "SERIES_PREFERENCES";
	  requestInfo.subscriberName = subscriber;
	  requestInfo.userId = userId;
	  requestInfo.recordingSetId = recordingSetId;
	  requestInfo.options = options;
	  var msg = JSON.stringify(requestInfo);
	  return $.ajax({
	    async : async,
	    type : "POST",
	    url : "ServerService",
	    contentType : 'application/json',
	    mimeType : 'application/json',
	    data : msg
	  });
}

function sendFMKeepAlive(keepAliveInfo) {
	 keepAliveInfo.actionService = 'KEEP_ALIVE';
	 var msg = JSON.stringify(keepAliveInfo);
	 return $.ajax({
	    async : true,
	    type : "POST",
	    url : "ServerService",
	    contentType : 'application/json',
	    mimeType : 'application/json',
	    data : msg
	  });
}

function sendKeepforever(item) {
	 var subscriber = (window.params && window.params.subscriberName)?window.params.subscriberName:subscriberParam;
	  var msg = "{'actionService': 'KEEPFOREVER', 'subscriberName' : '" + subscriber + "', 'recordingRefId' : '" + item.id + "'}";
	  return $.ajax({
	    async : true,
	    type : "POST",
	    url : "ServerService",
	    contentType : 'application/json',
	    mimeType : 'application/json',
	    data : msg
	  }); 
}

function getProgramInfo(item) {
	  var subscriber = (window.params && window.params.subscriberName)?window.params.subscriberName:subscriberParam;
	  var msg = "{'actionService': 'GETPROGRINFO', 'subscriberName' : '" + subscriber + "', 'programUrl' : '" + item.programUrl.uri + "'}";
	  return $.ajax({
	    async : true,
	    type : "POST",
	    url : "ServerService",
	    contentType : 'application/json',
	    mimeType : 'application/json',
	    data : msg
	  }); 
}

function updateAssetStatus(item, callback, listItem){
	var subscriber = (window.params && window.params.subscriberName)?window.params.subscriberName:subscriberParam;
	var userId = window.params.userSelected.id;
	var msg = "{'actionService': 'ASSETINFO_STATUS', 'subscriberName' : '" + subscriber + "', 'userId' : '" + userId + "', 'recordingId' : '" + item.id + "', 'currentStatus' : '" + item.status + "'}";
	$.ajax({
		type: "POST",
		url: "ServerService",
		contentType: 'application/json',
		mimeType: 'application/json',
		data: msg,
		success : function(data){
			this.assetInfoResponse = data;
			callback(this,listItem);
		}
	});
}


function subscriberPreferences(subscriber, async) {
	  var msg = "{\"actionService\": \"PREFERENCES\", \"subscriberName\" : \"" + subscriber + "\"}";
	  return $.ajax({
	    async : async,
	    type : "POST",
	    url : "ServerService",
	    contentType : 'application/json',
	    mimeType : 'application/json',
	    data : msg
	  });
}

function saveSubPreferences(subscriber, options) {
	  var msg = "{\"actionService\": \"SAVE_PREFERENCES\", \"options\" : " + JSON.stringify(options) + ", \"subscriberName\" : \"" + subscriber + "\"}";
	  return $.ajax({
	    async : true,
	    type : "POST",
	    url : "ServerService",
	    contentType : 'application/json',
	    mimeType : 'application/json',
	    data : msg
	  });
}

function deleteRecord(item, callback, callback2){
	var subscriber = (window.params && window.params.subscriberName)?window.params.subscriberName:subscriberParam;
	var userId = window.params.userSelected.id;
	var msg = "{'actionService': 'DELETE', 'subscriberName' : '" + subscriber +  "', 'recordingSetId' : '" + item.recordingSetId +  "', 'recordingSetType' : '" + item.recordingSetType + "', 'userId' : '" + userId + "', 'recordingId' : '" + item.id + "', 'type' : '" + item.status + "'}";
	$.ajax({
		type: "POST",
		url: "ServerService",
		contentType: 'application/json',
		mimeType: 'application/json',
		data: msg,
		success : function(data){
			if(data && !data.ERROR && data.status.state === "DELETED"){
				callback(true, data);
			}else{
			  if(callback2){
			    callback2(data);
			  } 
			}
		}
	});
}

function restoreRecord(item, callback, callback2){
	var subscriber = (window.params && window.params.subscriberName)?window.params.subscriberName:subscriberParam;
	var userId = window.params.userSelected.id;
	var msg = msg = "{'actionService': 'RESTORE', 'subscriberName' : '" + subscriber +  "', 'recordingSetId' : '" + item.recordingSetId +  "', 'recordingSetType' : '" + item.recordingSetType + "', 'userId' : '" + userId  + "', 'recordingId' : '" + item.id + "'}";
	$.ajax({
		type: "POST",
		url: "ServerService",
		contentType: 'application/json',
		mimeType: 'application/json',
		data: msg,
		success : function(data){
			if(data && !data.ERROR && data.status.state === "COMPLETED"){
				callback(true, data);
			}else{
			  if(callback2){
			    callback2(data);
			  } 
			}
		}
	});
}

function reScheduleProgram(item, callback){
	  //Test Monitor
	  var msgObj = {};
	  msgObj.className = "dataMonitorMsg";
	  msgObj.msg= "ReScheduling a Series episode title: "+ item.episodeTitle + ", airingId: " + item.airingId;
	  reportActivity(msgObj);
	  //Test Monitor---------------------------------
	var subscriber = (window.params && window.params.subscriberName)?window.params.subscriberName:subscriberParam;
	var msg = "{\"actionService\": \"SCHEDULE\", \"subscriberName\" : \"" + subscriber + "\", \"options\" : " + JSON.stringify(item.options) + ", \"item\" : " + JSON.stringify(item) + "}";
	$.ajax({
		type: "POST",
		url: "ServerService",
		contentType: 'application/json',
		mimeType: 'application/json',
		data: msg,
		success : function(data){
			if(data && data.ERROR){
				informErrorActivity(data);
			}else{
				informSuccessActivity(data);
				(callback || _.noop)();
			}
		}
	});
}

function cancelScheduleSeries(item, callback, destination){
	  //Test Monitor
	  var msgObj = {};
	  msgObj.className = "dataMonitorMsg";
	  msgObj.msg= "Canceling a Series title: "+ item.title + ", seriesId: " + item.id;
	  reportActivity(msgObj);
	  //Test Monitor---------------------------------
	var requestInfo = {};
	requestInfo.actionService = "CANCEL_SERIES";
	requestInfo.subscriberName = window.params.subscriberName;
	requestInfo.userId = window.params.userSelected.id;
	requestInfo.recordingSetId = item.id;
	var msg = JSON.stringify(requestInfo);
	$.ajax({
		type: "POST",
		url: "ServerService",
		contentType: 'application/json',
		mimeType: 'application/json',
		data: msg,
		success : function(data){
			if(data && data.ERROR || (data.status!= "INACTIVE")){
				informErrorActivity(data);
			}else{
				informSuccessActivity(data);
				callback(true);
			}
		}
	});
}

function deleteSeries(item, callback, destination){
	//Test Monitor
	var msgObj = {};
	msgObj.className = "dataMonitorMsg";
	msgObj.msg= "Deleting a Series title: "+ item.title + ", recording Set Id: " + item.id;
	reportActivity(msgObj);
    //Test Monitor---------------------------------
	var requestInfo = {};
	requestInfo.actionService = "DELETE_SERIES";
	requestInfo.subscriberName = window.params.subscriberName;
	requestInfo.userId = window.params.userSelected.id;
	requestInfo.recordingSetId = item.id;
	var msg = JSON.stringify(requestInfo);
	$.ajax({
		type: "POST",
		url: "ServerService",
		contentType: 'application/json',
		mimeType: 'application/json',
		data: msg,
		success : function(data){
			if(data && data.ERROR || (data.status != "DELETED")){
				informErrorActivity(data);
			}else{
				informSuccessActivity(data);
				callback(true);
			}
		}
	});
}

function sendStopRecording(item, callback, listItem, callback2){
	var subscriber = (window.params && window.params.subscriberName)?window.params.subscriberName:subscriberParam;
	var userId = window.params.userSelected.id;
	var msg = msg = "{'actionService': 'STOP', 'subscriberName' : '" + subscriber +  "', 'recordingSetId' : '" + item.recordingSetId +  "', 'recordingSetType' : '" + item.recordingSetType +  "', 'userId' : '" + userId +  "', 'recordingId' : '" + item.id + "'}";
	$.ajax({
		type: "POST",
		url: "ServerService",
		contentType: 'application/json',
		mimeType: 'application/json',
		data: msg,
		success : function(data){
			if(data && !data.ERROR && data.status.state === "COMPLETED"){
				callback(this, listItem, data);
			}else{
			  if(callback2){
			    callback2(data);
			  }
			}
		}
	});
}

function sendSyncMoxiNdvr(callback){
	var jsonConfig = JSON.parse(recordingConfig);
	var subscriber = jsonConfig.RecordingsSchedules.subscriber;
	var msg = "{'actionService': 'Sync', 'subscriberName' : '" + subscriber + "'}";
	$.ajax({
		type: "POST",
		url: "ServerService",
		contentType: 'application/json',
		mimeType: 'application/json',
		data: msg,
		success : function(data){
			if(data && data.status === "success"){
				if(callback) {
					callback();
				}
			}
		}
	});	
	
}

function validateSubscriber(asyncCall, subscriber) {
	  var msg = "{'actionService': 'VALIDATE_SUBSCRIBER', 'subscriberName' : '" + subscriber + "'}";
	  return $.ajax({
		async : asyncCall,
		type : "POST",
		url : "ServerService",
		contentType : 'application/json',
		mimeType : 'application/json',
		data : msg
	  });
}

function getCatchupPrograms(async, subscriber, recordingSet){
	  var msg = "{'actionService': 'CATCHUP_PROGRAMS', 'subscriberName' : '" + subscriber + "', 'recordings' : '" + recordingSet.recordings + "'}";
	  return $.ajax({
		async : async,
		type : "POST",
		url : "ServerService",
		contentType : 'application/json',
		mimeType : 'application/json',
		data : msg
	  });
}

function sendTrickPlayEvent(trickPlayObject){
	 trickPlayObject.actionService = "TRICK_PLAY";
	  var msg = JSON.stringify(trickPlayObject);
	  return $.ajax({
		async : true,
		type : "POST",
		url : "ServerService",
		contentType : 'application/json',
		mimeType : 'application/json',
		data : msg
	  });
}


function parseMetadata(metadata, findStr){
	var i = 0;
	var value = null;
	for(i;i<metadata.length;i++){
		if(metadata[i].name.indexOf(findStr)>-1){
			value = metadata[i].value;
			break;
		}
	}
	return value;
}

function getCrew(metadata, str){

	var val = [];

	for(var key in metadata){

		if(metadata[key].name === str){
			val.push(metadata[key].value);
		}

	}

	if(val.length!=0){ return val; }

}

var hashMap = [
	{
		name:'catchUp',
		type:0,
		hash:0
	},
	{
		name:'series',
		type:1,
		hash:0
	},
	{
		name:'recordings',
		type:2,
		hash:0
	},
	{
		name:'schedule',
		type:3,
		hash:0
	},
	{
		name:'deleted',
		type:4,
		hash:0
	}
];

function getOldObjects() {
	//keeps the value of the array before a new ajax call updates them
	oldAllItemsSR = allItemsSR;
	oldAllItemsPR = allItemsPR;
	oldAllItemsDEL = allItemsDEL;
	oldAllItemsTS = window.catchup;
	oldAllSeriesSet = window.seriesSets;
}

function setHashMap(res) {
	if(res.CATCHUP_TVHash){
		hashMap[0].hash = res.CATCHUP_TVHash;
	}
	if(res.seriesHash){
		hashMap[1].hash = res.seriesHash;
	}
	if(res.RecordingsHash){
		hashMap[2].hash = res.RecordingsHash;
	}
	if(res.SchedulesHash){
		hashMap[3].hash = res.SchedulesHash;	
	}
	if(res.DELETEHash){
		hashMap[4].hash = res.DELETEDHash;	
	}
}

function seekDiffs(res) {

	if (typeof hashMap[4].hash !== "undefined" && hashMap[4].hash !== res.DELETEDHash){getDiff( allItemsDEL, 4);}
	
	if (typeof hashMap[3].hash !== "undefined" && (hashMap[3].hash !== res.SchedulesHash)){ getDiff( allItemsSR, 3); }

	if (typeof hashMap[2].hash !== "undefined" && hashMap[2].hash !== res.RecordingsHash){ getDiff( allItemsPR, 2); }
	
	if (typeof res.seriesHash !== "undefined" && hashMap[1].hash !== res.seriesHash){ getDiff( window.seriesSets, 1); }

	if (typeof res.CATCHUP_TVHash !== "undefined" && hashMap[0].hash !== res.CATCHUP_TVHash){ getDiff( window.catchup, 0); }

}

function getDiff( newArray, type) {

	switch (type) {
		case 0:
			var oldArray = oldAllItemsTS;
			break;
		
		case 1:
			var oldArray = oldAllSeriesSet;
			break;
			
		case 2:
			var oldArray = oldAllItemsPR;
			break;
			
		case 3:
			var oldArray = oldAllItemsSR;
			break;
			
		case 4:
			var oldArray = oldAllItemsDEL;
			break;
	
		
	}

	if( oldArray !== 'undefined' && lastNavFocusPosition == type){

		function diff(compare, diff, callback) {

			var resultArray = [];

			_.each(compare, function (obj) {

				var val = 0;
				_.each(diff, function (item) {

					if( obj.id === item.id ){ val = 1; }

				});

				if (val === 0) { resultArray.push(obj) }

			});

			if(callback){ callback(resultArray)	}

		}

		//get the items in the old array that are going to be removed
		diff(oldArray, newArray, function (diffArray){
			if( !diffArray.length<1 ){
				for (var i = 0; i < diffArray.length; i++) {
					var id = '#' + diffArray[i].id;
					$(id).fadeOut(150, function () {
						$(this).remove();
					});
				}
			}
		});

		//get the new items in the new array to  be inserted
		diff(newArray, oldArray, function (diffArray){
			if( !diffArray.length<1 ){
				var cont = '#ndvrContainer';
				for (var i = 0; i < diffArray.length; i++) {
					renderItem(cont, diffArray[i]);
				}
			}
		});
		
		diffRefreshEpisodesNumber(oldArray, newArray);

	}

}

function diffRefreshEpisodesNumber(oldArray, newArray) {
	_.each(oldArray, function(obj) {
		_.each(newArray, function(item) {
			if (obj.id === item.id) {
				if (obj instanceof NdvrSeries) {
					$('#' + item.id + " div.series-number").html(
							item.episodes.length);
				}

			}

		});
	});

}

function saveSubscriberFavChannel(favObj){
	if(typeof(Storage) !== "undefined") {
		localStorage.setItem(CONSTANTS.LOCAL_STORAGE_SUBSCRIBER_FAV_CH + "_" + favObj.subcriber, JSON.stringify(favObj));
	} else {
	    alert("WebStorage not supported - error saving subscriber logged")
	}
}

function getSubscriberFavChannel(subscriber){
	var listFav = JSON.parse(localStorage.getItem(CONSTANTS.LOCAL_STORAGE_SUBSCRIBER_FAV_CH + "_" + subscriber));
	if(!listFav){
		listFav = {};
		listFav.favorites = [];
	}
	return listFav;
}

function saveSubscriberLogged(){
	if(typeof(Storage) !== "undefined") {
		localStorage.setItem(CONSTANTS.LOCAL_STORAGE_SUBSCRIBER, JSON.stringify(window.params.subscriber));
		localStorage.setItem(CONSTANTS.LOCAL_STORAGE_SUBSCRIBER_NAME, window.params.subscriberName);
	} else {
	    alert("WebStorage not supported - error saving subscriber logged")
	}
}

function removeSubscriberRemembered(){
	if(typeof(Storage) !== "undefined") {
		localStorage.setItem(CONSTANTS.LOCAL_STORAGE_SUBSCRIBER_NAME_VOLATILE, window.params.subscriberName)
		localStorage.removeItem(CONSTANTS.LOCAL_STORAGE_SUBSCRIBER);
		localStorage.removeItem(CONSTANTS.LOCAL_STORAGE_SUBSCRIBER_NAME);
		localStorage.removeItem(CONSTANTS.LOCAL_STORAGE_USER);
		localStorage.removeItem(CONSTANTS.LOCAL_STORAGE_DEVICE);
	} else {
	    alert("WebStorage not supported - error saving subscriber logged")
	}
}

function saveDevice(){
	if(typeof(Storage) !== "undefined") {
		localStorage.setItem(CONSTANTS.LOCAL_STORAGE_DEVICE, JSON.stringify(window.params.deviceSelected));
	} else {
	    alert("WebStorage not supported - error saving subscriber logged")
	}
}

function saveUser(){
	if(typeof(Storage) !== "undefined") {
		localStorage.setItem(CONSTANTS.LOCAL_STORAGE_USER, JSON.stringify(window.params.userSelected));
	} else {
	    alert("WebStorage not supported - error saving User logged")
	}
}


function getLocalStorageSubscriberName(){
	return localStorage.getItem(CONSTANTS.LOCAL_STORAGE_SUBSCRIBER_NAME);
}

function getLocalStorageSubscriberVolatile(){
	return localStorage.getItem(CONSTANTS.LOCAL_STORAGE_SUBSCRIBER_NAME_VOLATILE);
}

function getLocalStorageUser(){
	var storedUser = localStorage.getItem(CONSTANTS.LOCAL_STORAGE_USER);
	return (storedUser)?JSON.parse(storedUser):undefined;
}

function getLocalStorageDevice(){
	var storedDevice = localStorage.getItem(CONSTANTS.LOCAL_STORAGE_DEVICE);
	return (storedDevice)?JSON.parse(storedDevice):undefined;
}

function getLocalStorageSubscriber(){
	return localStorage.getItem(CONSTANTS.LOCAL_STORAGE_SUBSCRIBER);
}

function isSubscriberChannelValid(subscriber){
	if(subscriber.channels && subscriber.channels.length > 0 && subscriber.channels[0].channels.length > 0){
		return true;
	}else{
		var errorMsgObj = {};
		errorMsgObj.msg = "ERROR: No Channels availabe for this user";
	    errorMsgObj.type = "error";
		reportActivity(errorMsgObj);
		return false;
	}
}

function updateQuota(data){
	if(data.responseHeader){
		var responseQuota = data.responseHeader;
		window.params.quota.markedToKeep = responseQuota["X-ARRS-QUOTA-MARKED-TO-KEEP"][0][0];
		window.params.quota.total = responseQuota["X-ARRS-QUOTA-TOTAL"][0][0];
		window.params.quota.type = responseQuota["X-ARRS-QUOTA-TYPE"][0][0];
		window.params.quota.used = responseQuota["X-ARRS-QUOTA-USED"][0][0];
		if($('.popover').hasClass('in')){
			updateProgressQuota();
		}
	}
}

function updateProgressQuota(){
	var ereasable = 0; 
	var notEreasable = 0;
	var freePercent = 0;
	
	if(window.params.quota.markedToKeep && window.params.quota.used && window.params.quota.total){
		var markedToKeep = parseFloat(window.params.quota.markedToKeep);
		var used = parseFloat(window.params.quota.used);
		var total = parseFloat(window.params.quota.total);
	
		ereasable = Math.round(((used-markedToKeep) * 100)/ total)*100/100; 
		ereasable = (ereasable>0)?ereasable:0;
		notEreasable = Math.round((markedToKeep * 100)/ total)*100/100;
		freePercent = 100 - ereasable - notEreasable;		
	}

	$('#progressUsed').css("width", ereasable + '%');
	$('#progressUsed').attr('title', 'used ' + Math.round((used)) + " " + window.params.quota.type).tooltip('fixTitle');
	$('#progressKeep').css("width", notEreasable + '%');
	$('#progressKeep').attr('title', 'Keep ' + Math.round((markedToKeep)) + " " + window.params.quota.type).tooltip('fixTitle');
	$('#progressFree').css("width", freePercent + '%');
	if(freePercent<10){
		$('#progressFree').html("");	
	}else{
		$('#progressFree').html("Free");
	}
	$('#progressFree').attr('title', 'free ' + Math.round((total - used)) + " " + window.params.quota.type).tooltip('fixTitle');
	
}



function sendKeepAlive(keepAliveInfo){
	var program = window.programSelected;
	var msgObj = {};
	msgObj.msg= "Sending Keep Alive: " + program.metadata.title + ", Status: " + keepAliveInfo.payload.status + ", Time Elapsed: " + keepAliveInfo.payload.offset + " seconds.";
	msgObj.className = "dataMonitorMsg";
	reportActivity(msgObj);
	var deferred = sendFMKeepAlive(keepAliveInfo);
	  $.when(deferred).done(function(data) {
	    if(data && data.ERROR){
	      informErrorActivity(data.info);
	      console.log("Error sending KeepAlive to FM");
	    }else{
	    	informSuccessActivity(data.info);
	    	console.log("Sucess sending KeepAlive to FM");
	    }
	});
}

function createKeepAliveInterval(){
	var keepAliveTimeout = fmTimeoutCalc(window.activePlaybackSession.timeoutWindow);
	clearTimeout(window.intervalKeepAlive);
	window.intervalKeepAlive = setInterval(function() {
	    keepAliveTimeout = fmTimeoutCalc(window.activePlaybackSession.timeoutWindow);
		var payload = {};
		payload.status = "ACTIVE";
		if(!window.keepAliveFixedValue){
		  window.activePlaybackSession.timeElapsed = Math.floor(window.params.player.currentTime());
		}
		payload.offset = window.activePlaybackSession.timeElapsed;
		var user = getLocalStorageUser();
		var keepAliveInfo = {};
		keepAliveInfo.payload = payload;
		keepAliveInfo.sessionId = window.activePlaybackSession.sessionId;
		keepAliveInfo.userId = user.id;
		keepAliveInfo.type = window.activePlaybackSession.type;
		keepAliveInfo.recordingSetId = window.activePlaybackSession.recordingSetId;
		keepAliveInfo.subscriberName = window.params.subscriberName;
		sendKeepAlive(keepAliveInfo);
	}, keepAliveTimeout);
}

function fmTimeoutCalc(fmTimeOut){
	var keepAliveTimeout = 0;
	if (fmTimeOut && fmTimeOut > 0) {
		keepAliveTimeout = fmTimeOut;
	}else{
		keepAliveTimeout = 40;
	}
	var subtraction_factor = window.config.config_ui.fm_keep_alive_subtraction_factor/100;
	keepAliveTimeout = Math.round((keepAliveTimeout * subtraction_factor) * 1000);
	return keepAliveTimeout;
}

function getTotalTime(value){
	var time = parseInt(value,10);
    var hours   = Math.floor(time / 3600);
    var minutes = Math.floor((time - (hours * 3600)) / 60);
    var seconds = time - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}

function getRecordingDuration(start, end){
	var startTime = new Date(start);
	var endTime = new Date(end);
	var difference = endTime.getTime() - startTime.getTime(); // This will give difference in milliseconds
	return resultInMinutes = Math.round(difference / 60000);
}

function getTimeInMin(nowWatched){
	return Math.floor((nowWatched/60) << 0);
}

function getMinutesWatched(nowWatched){
  var min = Math.floor((nowWatched/60) << 0);
  var sec = Math.floor(nowWatched % 60);
  return min + "':" + sec + '"';
}

function getTimeWatched(nowWatched){
  var hours   = Math.floor(nowWatched / 3600);
  var minutes = Math.floor((nowWatched - (hours * 3600)) / 60);
  if (minutes < 10) {minutes = "0"+minutes;}
  return hours + ":" + minutes;
}

function setPlayerPosition(){
	window.params.player.off("loadedmetadata", setPlayerPosition);
	if(window.activePlaybackSession && window.activePlaybackSession.timeElapsed > 0){
		window.params.player.currentTime(window.activePlaybackSession.timeElapsed);	
	}
}

function findEpisode(progAiringId){
	var episode = undefined;
	$.each(window.seriesSets, function(i, idx) {
		episode = _.findWhere(idx.episodes, {airingId : progAiringId});
	   if(episode){
    	  return false;
	   }
	});
	return episode;
}

function removeEpisodeFromSeries(progAiringId){
	var episode = undefined;
	var ndvrSeriesArray = jQuery.grep(window.ndvrItems.allItems, function(a) {
		  return a instanceof NdvrSeries;
	});
	$.each(ndvrSeriesArray, function(i, seriesObj) {
		var found = false;
		ndvrSeriesArray = _.reject(seriesObj.episodes, function(episode){ 
			if( episode.airingId === progAiringId){
				found = true;
			}
			return found;
		});
		if(found){
			return false;
		}
	});
}

function filterProgramsByStatus(statusFilter, programArray){
  arrayFiltered =_.filter(programArray, function(program){
	  return (program.status.state === statusFilter);
  });
  return arrayFiltered;
}

function addFormatedDate(programArray){
	$.each(programArray, function(i, program) {
		program.formatedStart = getSimpleDate(getTimeStamp(program.eventStart), 'DD, mm/d', true);
	});
	return programArray;
}

function getRecSetOptionByType(type){
	var configMenuItems = jQuery.extend(true, {}, config.config_ui.recordingSetMainScreen.menuItem);
	return _.chain(configMenuItems).filter(function(item) { return item.type === type }).map(function(item) { return item.menuActions}).flatten().value();
}

function getSeriesSetOptionByStatus(type, status){
	var configMenuItems = jQuery.extend(true, {}, config.config_ui.recordingSetMainScreen.menuItem);
	var menuItemsArray =  _.chain(configMenuItems).filter(function(item) { return item.type === type }).map(function(item) { return item.menuActions}).flatten().filter(function(element){return element.status === status}).value();
	return menuItemsArray[0].menuActions;
}

function truncateText(str, length) {
    return str.length > length ? str.substring(0, length - 3) + '...' : str;
 }

function getSimpleDate(date, format, offset){
	var time;
	 if (offset) {
		 var offset = (new Date().getTimezoneOffset())*-1;
		 date = (date + (offset * 60 * 1000));
	 }
	
	 var result = null;
	 var formatted = new Date();
	 formatted.setTime(date);
	 switch (format) {
		case 'hh:mm':
			var hours = null;
		     var suffix = null;
		     var minutes =  ((formatted.getMinutes()<=9)?"0"+formatted.getMinutes():formatted.getMinutes())
		     hours = formatted.getHours();
	         suffix = (hours < 12) ? 'AM' : 'PM';
	         hours = hours % 12 || 12;   
	         hours = (hours<9)?"0" + hours : hours;
		     result = hours + ":" + minutes;
			break;
		case 'hh:mm ampm':
			 var hours = null;
		     var suffix = null;
		     var minutes =  ((formatted.getMinutes()<=9)?"0"+formatted.getMinutes():formatted.getMinutes())
		     hours = formatted.getHours();
	         suffix = (hours < 12) ? 'AM' : 'PM';
	         hours = hours % 12 || 12;   
	         hours = (hours<9)?"0" + hours : hours;
	         result = hours + ":" + minutes + " " + suffix;
			break;
		default:
			result = $.datepicker.formatDate(format, formatted)
			break;
	}
	 return result;
}

function addPlaybackProgressOnVOD(container, playbackOffset, durationSec){
	var divPlaybackProgressContainer = undefined;
	addPlaybackProgress(divPlaybackProgressContainer, container, playbackOffset, durationSec, 'gradientContainer', 'playbackProgressSeparator', 'playbackProgressInfo');
}

function addPlaybackProgressOnAssetInfo(container, playbackOffset, durationSec){
	$('#playbackProgress').remove();
	var divPlaybackProgressContainer = jQuery('<div/>', {
		"id" : 'playbackProgress'
	});
	addPlaybackProgress(divPlaybackProgressContainer, container, playbackOffset, durationSec, 'gradientContainer', 'playbackProgressSeparatorInfoAsset', 'playbackProgressInfoAsset');
}

function addStatusIconOnPoster(status, container){
	$('#posterIconStatus').remove();
	if(CONSTANTS.STATUS_ERROR === status || CONSTANTS.STATUS_CONFLICT === status){
		var imgPosterStatus = jQuery('<img/>', {
			"id" : "posterIconStatus",
			"class" : 'assetStatus ' + 'episode' + status
		});		
		imgPosterStatus.appendTo(container);
	}
}

function addPlaybackProgress(parentContainer, container, playbackOffset, durationSec, gradientClass, separatorClass, progressInfoClass){
	var timeElapsedPercentage = getPercentageElapsed(durationSec, playbackOffset); 

	if(parentContainer){
		parentContainer.appendTo(container);
	}else{
		parentContainer = container;
	}
	
	var divGradientContainer = jQuery('<div/>', {
		"class" : gradientClass
	});	
	divGradientContainer.appendTo(parentContainer);
	
	var progressSeparator = jQuery('<div/>', {
		"class" : separatorClass
	});	
	progressSeparator.appendTo(parentContainer);
	
	var progressInfo = jQuery('<div/>', {
		"class" : progressInfoClass
	});
	var timeElapsed = getTimeWatched(playbackOffset); 
	progressInfo.html(timeElapsed).appendTo(parentContainer);
	
	parentContainer.append(						
		'<div class="progress playbackProgress">' +
			  '<div class="progress-bar progress-bar-danger playProgressCustomized" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:' + timeElapsedPercentage + '%"></div>' +
		'</div>');
}

function hasBookmark(item){
	return !_.isUndefined(item.bookmarkOffset);
}

