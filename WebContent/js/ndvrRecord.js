function NDVRRecord(id, bookmarkOffset, ndvrType, itemHash, programUrl, poster, channelImage, programId, programStartTime, showBeggining, programEndTime, referenceStartTimeStamp, referenceEndTimeStamp, subscriber, title, recordingStart, recordingEnd, duration, duration_program, offset_playback_duration, offset_playback_bar, progdurationInSec, playbackUrl, channelId, status, type, content_type, airingId, keepforever, metadata, parent, episodeTitle, options) {
	var that = this;
	this.id = id;
	this.bookmarkOffset = bookmarkOffset;
	this.ndvrType = ndvrType;
	this.itemHash = itemHash;
	this.programUrl = programUrl;
	this.programId = programId;
	this.url_img_poster = poster;
	this.img_channel_logo = channelImage;
	this.date = getDateFormatted(programStartTime);
	this.programStartTime = programStartTime;
	this.referenceStartTimeStamp = referenceStartTimeStamp;
	this.referenceEndTimeStamp = referenceEndTimeStamp;
	this.showBeggining = showBeggining;
	this.subscriber = subscriber;
	this.title = title;
	this.ndvr_url_playback = playbackUrl;
	this.channelId = channelId;
	this.dateUnderPoster = getSimpleDate(programStartTime, 'DD, mm/d', true);
	this.timeUnderPosterStart = getSimpleDate(referenceStartTimeStamp, 'hh:mm', true);
	this.timeUnderPosterEnd = getSimpleDate(referenceEndTimeStamp, 'hh:mm ampm', true);
	this.recordingStart = recordingStart;
	this.recordingEnd = recordingEnd;
	this.duration_playback = duration;
	this.duration_program = duration_program;
	this.offset_playback_duration = offset_playback_duration;
	this.offset_playback_bar = offset_playback_bar;
	this.progdurationInSec = progdurationInSec;
	this.status = status;
	this.type = (status==="ERROR" || status==="CONFLICT")?status:type;
	this.content_type = content_type;
	this.airingId = airingId;
	this.keepforever = keepforever;
	this.metadata = metadata;
	this.metadata.air_date = getSimpleDate(metadata.air_date, 'mm/dd/yy');
	this.parent = parent;
	this.episodeTitle = episodeTitle;
	this.options = options;
	
	function getDateFormatted(date){
	 var dateFormat = null;
	 try{
		 var dateInstance = new Date(date);
		 dateFormat = $.datepicker.formatDate('MM dd', dateInstance);
		 var compareDate = $.datepicker.formatDate('MM dd', new Date());
		 var yesterdayDate = new Date();
		 yesterdayDate.setDate(yesterdayDate.getDate() - 1);
		 var yDateFormatted =  $.datepicker.formatDate('MM dd', yesterdayDate);
		 if(dateFormat == "undefined NaN"){
			 dateFormat = "date not found";
			 throw "error formating date..!";
		 }
		 var hours = null;
		 var suffix = null;
		 var minutes =  ((dateInstance.getMinutes()<=9)?"0"+dateInstance.getMinutes():dateInstance.getMinutes())
		 hours = dateInstance.getHours();
	     suffix = (hours < 12) ? 'am' : 'pm';
	     hours = hours % 12 || 12;   
	     hours = (hours<9)?"0" + hours : hours;
         if(compareDate == dateFormat){
        	 dateFormat = "Today " +  hours + ":" + minutes + " " + suffix;	 
	     }else if (yDateFormatted == dateFormat){
	    	 dateFormat = "Yesterday " +  hours + ":" + minutes + " " + suffix;
	     }else{
	    	 dateFormat = dateFormat + " " + hours + ":" + minutes + " " + suffix; 
	     }
	 }catch(err){
		console.log(err); 
	 }	
		
	 return dateFormat;
	}

}





