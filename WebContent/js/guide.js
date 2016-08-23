// url params
window.params = {};
window.params.quota = {};
window.ndvrItems = {allItems:[]};
window.seriesSets = {};
window.catchup = {};
window.catchupChannels =[];
window.catchupHash = undefined;
window.seriesSets = [];
window.config;
window.tv_ratings = [];
window.indexPrograms = 0;
window.indexChannels = 0;
window.refreshInterval = undefined;
window.refreshIntervalCatchup = undefined;
window.intervalKeepAlive = undefined;
window.validateInTimeOut = undefined;
window.activePlaybackSession = {};
window.favorites = [];
window.poster = undefined;
window.jsonCounter = 0;
window.scheduleOption_keep_index = 0;
window.scheduleOption_startOffset_index = 0;
window.scheduleOption_endOffset_index = 0;
window.scheduleOption_accept_index = 0;
window.scheduleOptionFlag = false;
window.keepAliveFixedValue = false;
window.playingLive = false;
//window.ajaxFlag = true;

window.timeline;

$(function() {
  'use strict';
  getQueryParams();
  loadConfigGuide();
  showMonitorDialog();
  logginProcess();
  preparePopOverDialog();

});

function logginProcess(){
  var rememberedSubscriberName = getLocalStorageSubscriberName();
  if(rememberedSubscriberName && rememberedSubscriberName.length > 0){
	  window.params.subscriberName = rememberedSubscriberName;
	  var rememberedSubscriber = getLocalStorageSubscriber();
	  window.params.userSelected = getLocalStorageUser();
	  window.params.subscriber = JSON.parse(rememberedSubscriber);
	  
	  validateSubToRenderEPG(function(){
		  if(window.params.subscriber){
			  init();
		  }else{
			  showLoginDialog();
		  }
	  }, false);

  }else{
	  showLoginDialog();
  }
}

function showMonitorDialog(){
  var position = {};
  position.x = 0.25;
  position.y = 0.04;
  window.params.test = "true";
  createMonitorDialog(position);
}

function initializezGuide(){
	  window.params.validatingUser = true;
	  $('#signButton').prop('disabled', true);
	  var subscriberText = $('#inputSubscriberId');
	  window.params.newSubscriber = {};
	  window.params.newSubscriberName = undefined;
	  window.params.subscriberName = subscriberText.val();
	  if( subscriberText.val() &&  subscriberText.val()!=="" && subscriberText.val()!=="Subscriber ID"){
		  validateSubToRenderEPG(function(){
			  if(window.params.subscriber){
			  	  $('#modalLogin').modal('hide');
		  		  var targetUser = getLocalStorageUser();
		  		  if(targetUser){
		  		   var userFound = _.findWhere(window.params.subscriber.users, {id: targetUser.id});
		  		   if(userFound){
		  			 window.params.userSelected = userFound;
		  		   }else{
		  			 window.params.userSelected = window.params.subscriber.users[0];
		  			saveUser();
		  		   }
		  	      }else{
		  		     window.params.userSelected = window.params.subscriber.users[0];
		  		     saveUser();
		  	      }
			  	  if(!window.params.deviceSelected){
			  		  window.params.deviceSelected = {};
			  		  window.params.deviceSelected.id = "Unknown";
			  		  window.params.deviceSelected.name = "Unknown";
			  	  }
			  	  if($('#rememberCheck').is(":checked")){
			      	  saveSubscriberLogged();
			  	  }else{
			  		  removeSubscriberRemembered();
			  	  }
			  	  init();
			    }else{
			    	window.params.validatingUser = undefined;
			    	$('#signButton').prop('disabled', false);
			    }
		  }, false);
	  }
}

function showLoginDialog(){
  var subscriberText = $('#inputSubscriberId');
  subscriberText.keydown(function(event) {
	  if(event.keyCode === 13 && !window.params.validatingUser){
		  initializezGuide();
	  }
  });

  $('#signButton').bind('click', initializezGuide);
  $('#modalLogin').modal('show');
  subscriberText.focus();
}

function preparePopOverDialog(){
	renderPopoverDialog();
	renderUserPopoverDialog();
	renderDevicePopoverDialog();
}


function RenderGuide(){
	$('.loading').fadeOut(1000);
	  // Show current time
	showCurrentTime();
	setInterval(showCurrentTime, 60000);
	$('.btn_ch_up').on('click', changePageChannels.bind(this,-1));
	$('.btn_ch_down').on('click', changePageChannels.bind(this,1));
	getRecordings(function(){
		getProgramRTV();
		initTimeline(decorate);
	});
	favoriteListener();
	responsiveRender();
	showRememberedInformation();
	
	
	$('#selectUser').modal('show');
	
}


function showRememberedInformation(){
	showSubscriberSelected();
	showDeviceSelected();
	showUserSelected();
}


function loadDecorate(){
	loadCatchUp(true, addCatchupPrograms.bind(this));
	loadItemsNdvr(true, updateGuideProgramStatus.bind(this));
}

function getRecordings(callback){
	loadCatchUp(false);
	loadItemsNdvr(false);
	if(callback){
		callback();
	}
}

function decorate(){
    addCatchupPrograms();
    updateGuideProgramStatus();
}

function favoriteListener(){
 $('#favoriteIcon').bind('click', function(){
   var enabled = $(this).hasClass('filterFavoriteEnabled');
   if(enabled){
	 unFilterChannels();
     $(this).removeClass('filterFavoriteEnabled');
   }else{
     favoriteFilter(window.favorites);
     $(this).addClass('filterFavoriteEnabled');
   }
  });
}

function favoriteFilter() {
  loadingGrid(true);
  var timeline = window.timeline;
  var groups = [];

  window.params.channels.channels
  var favoriteChannels = [];
  window.favorites.forEach(function(favChannel) {
   var channel = _.findWhere(window.params.channels.channels, { station_channel_id : favChannel});
   if(channel){
	 favoriteChannels.push(channel);
   }
  });

  createGroupsOfChannels(groups, favoriteChannels);

  timeline.itemSet.groupsData.clear();
  timeline.itemSet.itemsData.clear()
  timeline.groupsData.add(groups);

  var dataItems = [];
  var channelsRequested = timeline.groupsData.getIds();
  var now = new Date(timeline.getCurrentTime()).getTime();
  var start = new Date(timeline.getWindow().start);
  var end = new Date(timeline.getWindow().end);
  start.setHours(start.getHours() - window.configGuide.lazy_load_request_hours);
  end.setHours(end.getHours() + window.configGuide.lazy_load_request_hours);

  var deferred = moreEPGInfo(window.params.subscriberName, start.getTime(), end.getTime(), channelsRequested);
  $.when(deferred).then(function(program) {
    window.params.start = program.start;
    window.params.end = program.end;
    createPrograms(dataItems, program.epgGuide);
    timeline.setItems(dataItems);
    //decorate catchup again
    window.catchupChannels = [];
    addCatchupPrograms();
    
    loadingGrid(false);
  });

}

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

function init() {
  loadTvRating();
  loadConfigs();
  RenderGuide();
};

function validateSubToRenderEPG(callback, resign){
	  var subscriber = undefined;
	  if(resign){
		  subscriber = window.params.newSubscriberName;
	  }else{
		  subscriber = window.params.subscriberName;
	  }
	  //Test Monitor
	  var msgObj = {};
	  msgObj.className = "dataMonitorMsg";
	  msgObj.msg= "Validating Subscriber: " + subscriber;
	  reportActivity(msgObj);
	  //Test Monitor------------------------------
	  var asyncCall = false;
	  var deferred = validateSubscriber(asyncCall, subscriber);
	  deferred.done(function(data) {
			if (data.subscriber && data.subscriber.ERROR) {
				window.params.subscriber = undefined;
				informErrorActivity(data.subscriber);
			} else {
				if(resign){
					window.params.newSubscriber = data.subscriber;
				}else{
				   window.params.subscriber = data.subscriber;
				}
				informSuccessActivity(data.subscriber);
			}
			if(callback){
				callback();
			}
	  });
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
  //$('.container').attr('style', 'height:' + window.params.responsiveStyles.info_height + 'px !important;');
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

function changePageChannels(direction) {
  var firstGroup = parseInt($(window.timeline.groupsData.get()).first()[0].id);
  var lastGroup = parseInt($(window.timeline.groupsData.get()).last()[0].id);
  if (firstGroup + direction >= 1) {
    if (direction > 0) {
      renderNextGroups(lastGroup, direction, function(){
    	  decorate()
      });
    } else {
      renderNextGroups(firstGroup, direction, function(){
    	  decorate();
      });
    }
  }
};

function loadConfigGuide(){
	  $.ajax({
	    dataType : "json",
	    async : false,
	    url : './config/configGuide.json',
	    success : function(json) {
	      window.configGuide = json;
	    }
	  });
}


function loadConfigs(){

  $.ajax({
    dataType : "json",
    async : false,
    url : './config/config_ui.json',
    success : function(json) {
      window.config = json;
    }
  });

  window.params.pressedKey = "";

  $('#my_recordings').bind('click', function(){
	 window.location.href = "index.html"; 
  });
  
  $('#myRecordingIcon').bind('click', function(){
		 window.location.href = "index.html"; 
  });
  
};


loadCatchUp = function (isAsync,callback) {
  var requestInfo = {};
  requestInfo.actionService = "GET";
  requestInfo.exclude = "NONE";
  requestInfo.subscriber = window.params.subscriberName;
  requestInfo.userId = window.params.userSelected.id;
  var dataRequest = JSON.stringify(requestInfo);
  $.ajax({
    type: "POST",
    url: "ServerService",
    contentType: 'application/json',
    async : isAsync,
    mimeType: 'application/json',
    data: dataRequest,
    success : function(data){
      if(data.CATCHUP_TV && data.CATCHUP_TV.ERROR){
        $('.imgStatus').attr('src','css/images/linkNotAvailable.png');
        $('#linkIconHeader').html('NDVR Server ' + data.CATCHUP_TV.ERROR);
        cleanIntervalCatchup();
        return;
      }else{
        $('#linkIconHeader').html('');
        $('.imgStatus').attr('src','css/images/linkAvailable.png');
      }

      window.catchup = parseCatchupResponse(data);

      cleanIntervalCatchup();

      if(callback){
        callback();
      }
    }
  });
};


function loadItemsNdvr(isAsync, callback) {
  var requestInfo = {};	
  requestInfo.actionService = "GET";
  requestInfo.exclude = "CATCHUP_TV";
  requestInfo.subscriber = window.params.subscriberName;
  requestInfo.userId = window.params.userSelected.id;
  var dataRequest = JSON.stringify(requestInfo);
  $.ajax({
    type : "POST",
    url : "ServerService",
    contentType : 'application/json',
    async : isAsync,
    mimeType : 'application/json',
    data : dataRequest,
    success : function(data) {
      if(data.Recordings[0] && data.Recordings[0].ERROR){
        $('.imgStatus').attr('src','css/images/linkNotAvailable.png');
        $('#linkIconHeader').html('NDVR Server ' + data.Recordings[0].ERROR);
        cleanInterval();
        return;
      }
      $('#linkIconHeader').html('');
      $('.imgStatus').attr('src','css/images/linkAvailable.png');
      // Clear on refresh.
      window.ndvrItems.allItems = [];
      window.ndvrItems.allItemsPR = parseResponse(data, "Recordings");

      window.ndvrItems.allItemsSR = parseResponse(data, "Schedules");

      $.merge(window.ndvrItems.allItems, window.ndvrItems.allItemsPR);
      $.merge(window.ndvrItems.allItems, window.ndvrItems.allItemsSR);
      
      //window.seriesSets = parseSeriesResponse(data);

      if(callback){
        callback();
      }
      updateQuota(data);
      cleanInterval();
    },
  error: function(XMLHttpRequest, textStatus, errorThrown) {
    $('.imgStatus').attr('src','css/images/linkNotAvailable.png');
    $('#linkIconHeader').html('Ui Server: Error connection refused');
  }
 });

};

function cleanInterval(){
   clearInterval(window.refreshInterval);
    window.refreshInterval = setInterval(function() {
      loadItemsNdvr(true, updateGuideProgramStatus.bind(this));
    }, window.configGuide.refresh_interval_ms);
}

function cleanIntervalCatchup(){
  clearInterval(window.refreshIntervalCatchup);
   window.refreshIntervalCatchup = setInterval(function() {
     loadCatchUp(true, addCatchupPrograms.bind(this));
   }, window.configGuide.refresh_interval_Catchup_ms);
}

function addCatchupPrograms() {
  if(!window.timeline || !window.timeline.itemsData){
    return;
  }
  
  // Create a map of program id -> Catch Up Set object
  // Here we may add logic for identifying specific catch up set given the owner
  var catchUpSetForId = {};
  $.each(window.catchup, function(i, catchupSet) {
	  var ids = window.timeline.itemsData.getIds({filter:getIdsByStationId.bind({"catchupSet":catchupSet})});
	  $.each(ids, function(i, id) {
		  if (catchUpSetForId[id] === undefined) {
			  catchUpSetForId[id] = catchupSet;
		  }
	  });
  });

  var channel = undefined;
  var catchupFound = undefined;
  $.each(catchUpSetForId, function(id, catchupSet) {
    var program = window.timeline.itemsData.get(id);
    if(catchupSet.isInCatchupPeriod(program)){
    	if (program.programType !== "CATCHUP_TV") {
	        program.programType = "CATCHUP_TV";
	        program.status = "CATCHUP_TV";
	        program.metadata.status = "CATCHUP_TV";
	        program.recordingSetId = catchupSet.id;
	        channel = window.timeline.groupsData.get(program.group);
	        if (program && program.content.children) {
	          catchupFound = window.catchupChannels.indexOf(channel.id);
	          var sizeh = window.screen.availHeight * 0.010;
	          var sizew = window.screen.availHeight * 0.015;
	          addIconInProgram(program, sizew + 'px', sizeh + 'px', 'css/images/catchupTVChannel.png', 'catchup');
	          if(window.catchupChannels.length==0 || catchupFound==-1){
	            var sizeh = window.screen.availHeight * 0.015;
	            var sizew = window.screen.availHeight * 0.022;
	            addIconInChannel(channel, sizew + 'px', sizeh + 'px', 'css/images/catchupTVChannel.png', 'catchup');
	            window.catchupChannels.push(channel.id);
	          }
	        }
	        window.timeline.itemsData.update(program);
    	}
    } else {
    	if (program.programType === "CATCHUP_TV") {
    		// The program is marked as catch up but it is not in the catch up period anymore, so we need to remove its catch up state
    	    var imgIcon = $(program.content).find('#catchup');
    	    imgIcon.remove();
    	    program.metadata.status = "EPG";
    	    program.status = "EPG";
    	    window.timeline.itemsData.update(program);
    	}
    }
  });
  
}

//function(item){return item.group===catchupSet.channel}
function getIdsByStationId(item){
	var result = false;
	for(i=0;i<this.catchupSet.channels.length;i++){
		result = item.group === this.catchupSet.channels[i];
		if(result){
			break;
		}
	}
	return result;
}




function createChannel(item, station_id, station_channel_id, call_sign) {
  item.className = "channelTemplate";
  if (window.device.isIpad()) {
    item.style.height = (window.params.responsiveStyles.grid_height * (0.085 * window.device.height_fact)) + 'px';
  }
  if (window.device.isIphone()) {
    item.style.height = (window.params.responsiveStyles.grid_height * (0.085 * window.device.height_fact)) + 'px';
  }
  if (window.device.isAndroid()) {
    item.style.height = (window.params.responsiveStyles.grid_height * (0.072 * window.device.height_fact)) + 'px';
  }
  if (window.device.isBrowser()) {
    item.style.height = (window.params.responsiveStyles.grid_height * (0.068 * window.device.height_fact)) + 'px';
  }
  var chnumber = document.createElement('div');
  chnumber.className = "station";
  chnumber.textContent = station_channel_id;
  item.appendChild(chnumber);
  var name = document.createElement('div');
  name.appendChild(document.createTextNode(call_sign));
  item.appendChild(name);
};

function createGroupsOfChannels(groups, channels) {
  for (var i = 0, len = channels.length; i < len; ++i) {
    var channel = channels[i];
    window.indexChannels += 1;
    var item = document.createElement('div');
    var channelIconContainer = document.createElement('div');
    var catchupIconContainer = document.createElement('div');

    channelIconContainer.style.width = window.params.responsiveStyles.grid_height * (0.068 * window.device.height_fact) + 'px';
    channelIconContainer.style.height = window.params.responsiveStyles.grid_height * (0.06* window.device.height_fact) + 'px';
    channelIconContainer.style.float = "left";
    channelIconContainer.style.background = "rgb(86, 85, 85)";
    channelIconContainer.style.borderRadius = "4px";

    catchupIconContainer.id = "catchup";
    catchupIconContainer.style.width = window.params.responsiveStyles.grid_height * (0.03 * window.device.height_fact) + 'px';
    catchupIconContainer.style.height = window.params.responsiveStyles.grid_height * (0.03 * window.device.height_fact) + 'px';
    catchupIconContainer.style.float = "left";
    catchupIconContainer.style.marginLeft = "5%";

    var uriImg = window.config.config_ui.channelIcon + channel.station_id;

    var imgElement = jQuery('<img/>', {

      "class": "channelIcon",
      "src": uriImg,
      "style": "width:" + window.params.responsiveStyles.grid_height * 0.055 * window.device.height_fact  +"px; height:" + window.params.responsiveStyles.grid_height * 0.055 * window.device.height_fact + 'px'

    }).error(function() {
        $(this).attr('src','css/images/noChannelIcon.png');
    });

    var favoriteIcon = document.createElement('div');
    var exist = window.favorites.indexOf(channel.station_channel_id)<0;
    favoriteIcon.setAttribute('class','favoriteIconDisable');
    if(!exist){
      favoriteIcon.setAttribute('class','favoriteIconDisable favoriteIconEnabled');
    }
    favoriteIcon.setAttribute('stationId', channel.station_channel_id);
    favoriteIcon.addEventListener('click', function(evt) {
      var itemDom = $(this);
      var enabled = itemDom.hasClass('favoriteIconEnabled');
      var stationId = evt.target.getAttribute('stationid');
      if(enabled){
        window.favorites = _.without(window.favorites,stationId);
        saveFavoriteChannels(window.params.subscriberName, window.favorites);
        itemDom.removeClass('favoriteIconEnabled');
        $('#modalInfoScreen').modal('hide');
      }else{
        $(this).addClass('favoriteIconEnabled');
        if (window.favorites.indexOf(stationId)<0){
          window.favorites.push(stationId);
          saveFavoriteChannels(window.params.subscriberName, window.favorites);
          $('#modalInfoScreen').modal('hide');
        }
      }
    });
    channelIconContainer.appendChild(imgElement[0]);
    item.appendChild(channelIconContainer);
    item.appendChild(catchupIconContainer);
    item.appendChild(favoriteIcon);
    var itemElement = $(item);
    
    itemElement.bind('contextmenu', function(e) {
    	var itemDom = $(this); 
        var rightMenu = $('.rigth_menu');
        rightMenu.hide();
        loadChannelOptions(itemDom);
        if(rightMenu.find('ul').find('li').length>0){
           rightMenu.css({
              top : itemDom.offset().top - 80 + 'px',
              left : itemDom.offset().left + 10 + 'px'
           }).show();
        }
   });
    
    
    createChannel(item, channel.station_id, channel.station_channel_id, channel.call_sign);
    groups.push({
      'id' : channel.station_id,
      'uri' : channel.uri,
      'content' : item
    });
  }
};

function createPrograms(dataItems, programs) {
  addNdvrInfo(programs);
  for (var i = 0, len = programs.length; i < len; ++i) {
    var program = programs[i];
    window.indexPrograms += 1;
    dataItems.push({
      'id' : window.indexPrograms,
      'content' : createProgramTemplate(program),
      'start' : moment.unix(program.air_date).utc().format(),
      'end' : moment.unix(program.end_date).utc().format(),
      'group' : program.stationChannel,
      'status' : program.status,  //SCHEDULED|CAPTURING|COMPLETED
      'metadata': program,
      'recOptions': program.options,
      'recordingId': program.recordingId
    });
  }
};

function addNdvrInfo(epgPrograms) {
  var progamObj = undefined;
  $.each(epgPrograms, function(i, item) {
    programObj = _.findWhere(window.ndvrItems.allItems, { airingId : item.airingId});
    if(!programObj){
    	item.type = findEpisode(item.airingId)?"episode":"epg";
    }else{
    	item.type = "regular";
    }
    if(programObj){
      item.status = programObj.status;
      item.options = programObj.options;
      item.subcriberRecordingId = programObj.id;
      programObj = undefined;
    }
  });
}


function createProgramTemplate(program) {
  var item = document.createElement('div');
  var itemTitle = document.createElement('div');
  itemTitle.appendChild(document.createTextNode(program.title));
  item.appendChild(itemTitle);
  var size = undefined;
  switch (program.status) {
    case "RECEIVED" :
    case "SCHEDULED" :
      size = window.screen.availHeight * 0.016 * window.device.height_fact;
      addImage(item,size + 'px',size + 'px','css/images/clock.png', "status");
      break;
    case "CAPTURING":
      size = window.screen.availHeight * 0.015 * window.device.height_fact;
      addImage(item,size + 'px',size + 'px','css/images/red_dot_icon.png', "status");
      break;
    case "COMPLETED":
      size = window.screen.availHeight * 0.016 * window.device.height_fact;
      addImage(item,size + 'px',size + 'px','css/images/player_play.png', "status");
      break;
    case "ERROR":
      size = window.screen.availHeight * 0.016 * window.device.height_fact;
      addImage(item,size + 'px',size + 'px','css/images/errorRequest.png', "status");
      break;
    case "CONFLICT":
        size = window.screen.availHeight * 0.016 * window.device.height_fact;
        addImage(item,size + 'px',size + 'px','css/images/conflict.png', "status");
        break;
    default:
      break;
  }
  return item;
}

function addImage(item,sizeW, sizeH, image, type){
  var img = $(item).find('[id=' + type + ']');
  if (!img.length > 0) {
    img = document.createElement('img');
    img.id = type;
    item.appendChild(img);
  }
  $(img).attr('src', image);
  $(img).attr('style', 'width:' + sizeW + '; height:' + sizeH + '; position:relative; float: right');
}

function initTimeline(callback) {
  var subscriber = window.params.subscriberName;
  var deferred1 = getChannelList(subscriber);
  var deferred3 = getInitProgramGuide(subscriber);

    $.when(deferred1).then(function(channels) {
        deferred3.done(function(programs) {
      	if(channels.ERROR){
      		informErrorActivity(channels);
      		return;
      	}
      	  window.params.channels = {};
          window.params.end = programs.end;
          window.params.start = programs.start;
          window.params.channels.channels = _.sortBy(channels.channels, 'channelId'); //sortChannels(channels);
          window.params.programs = programs;
          window.params.cachePrograms = programs;
          
          var subfavObj = getSubscriberFavChannel(subscriber);
          window.favorites = subfavObj.favorites;

          var groups = [];
          var first_channels = _.first(window.params.channels.channels, configGuide.channels_count[window.device.name]);
          createGroupsOfChannels(groups, first_channels);

          var dataItems = [];

          createPrograms(dataItems, programs.epgGuide);
          var items = new vis.DataSet(dataItems, {
            type : {
              start : 'ISODate',
              end : 'ISODate'
            }
          });


          var date = new Date();
          date.setMinutes(date.getMinutes() - window.configGuide.still_grid_minutes);
          var dateMin = new Date();
          dateMin.setMinutes(dateMin.getMinutes() - 9000);
          // Configuration for the Timeline
          var options = {
            showCurrentTime : true,
            orientation : 'top',
            stack : false,
            start : moment.utc(date).format(), // now
            end : moment(moment.utc().valueOf() + 1000 * 60 * 60 * 5).utc().format(),
            min : moment.utc(dateMin).format(),
            /* max: moment(moment.utc().valueOf() + 1000 * 60 * 60 * 24).utc().format(), // now + 12 hours in milliseconds */
            zoomable : false,
            width : '100%',
            height : window.params.responsiveStyles.grid_height * 1.00 + 'px',
            margin : {
              item : {
                horizontal : 0,
                vertical : 0
              },
              axis : 0
            }
          };

          // DOM element where the Timeline will be attached
          var container = document.getElementById('visualization');

          // Create a Timeline
          window.timeline = new vis.Timeline(container, items, groups, options);

          //
          // Timeline events
          //
          window.timeline.on('select', function(properties) {
            if (properties.items[0]) {
              $('.posterTitleContainer').show();
              hideRightMenu();
              if(!window.playingLive){
                 hidePigVideo();  
              }
              window.params.columnFocusDate = new Date(window.timeline.itemSet.items[properties.items[0]].data.start);
              loadProgramInfo(window.timeline.itemSet.items[properties.items[0]].data);
            }
          });

          window.timeline.on('rangechanged', function(properties) {
            hideRightMenu();
            var startTimeLine = moment.utc(properties.start).unix();
            var endTimeLine = moment.utc(properties.end).unix();

            var dateEnd = new Date(window.params.end * 1000);
            dateEnd.setMinutes(dateEnd.getMinutes() - window.configGuide.lazy_load_right_minutes);

            var dateStart = new Date(window.params.start * 1000);
            dateStart.setMinutes(dateStart.getMinutes() + window.configGuide.lazy_load_left_minutes);
            var deferred = undefined;
            var direction;
            var startLazyLoadRequest, endLazyLoadRequest, applyLazyLoad = false;
            if (startTimeLine <= moment.utc(dateStart).unix()) {
              direction = -1;
              startLazyLoadRequest = new Date(window.params.start * 1000);
              endLazyLoadRequest = new Date(window.params.start * 1000);
              startLazyLoadRequest.setHours(startLazyLoadRequest.getHours() - window.configGuide.lazy_load_request_hours);
              applyLazyLoad = true;
            } else if (endTimeLine >= moment.utc(dateEnd).unix()) {
              direction = 1;
              startLazyLoadRequest = new Date(window.params.end * 1000);
              endLazyLoadRequest = new Date(window.params.end * 1000);
              endLazyLoadRequest.setHours(endLazyLoadRequest.getHours() + window.configGuide.lazy_load_request_hours);
              applyLazyLoad = true;
            }
            if (applyLazyLoad) {

              // get Ids from ChannelCache - build method that get i.e 10 channels.. and keep index related to what channels are in cache and channels are rendering now
             // var channelsRequested = timeline.itemSet.groupIds;
              var channelsRequested = timeline.itemSet.groupIds;
              var deferred = moreEPGInfo(window.params.subscriberName, startLazyLoadRequest.getTime(), endLazyLoadRequest.getTime(), channelsRequested);
              $.when(deferred).then(function(programs) {
                //window.ajaxFlag=true;
                if (direction > 0) {
                  window.params.end = programs.end;
                } else {
                  window.params.start = programs.start;
                }

                var newItems = [];

                $.each(programs.epgGuide, function(i, item) {
                  var program = _.findWhere(window.params.programs.epgGuide, {
                    airingId : item.airingId,
                    stationChannel : item.stationChannel
                  });
                  if (!program) {
                    newItems.push(item);
                  }
                });
                $.merge(window.params.programs.epgGuide, newItems);

                var dataItems = [];
                createPrograms(dataItems, newItems);
                window.timeline.itemsData.update(dataItems);
                decorate();
              });

            }
          });

          window.timeline.on('rightclick', function(properties) {
            var rightMenu = $('.rigth_menu');
            rightMenu.hide();
            if (properties.items[0]) {
              $('.posterTitleContainer').show();
              if(!window.playingLive){
                  hidePigVideo();  
              }
              window.params.columnFocusDate = new Date(window.timeline.itemSet.items[properties.items[0]].data.start);
              loadProgramInfo(window.timeline.itemSet.items[properties.items[0]].data);
              loadCTA(window.timeline.itemsData.get(properties.items[0]));
              if(rightMenu.find('ul').find('li').length>0){
                  rightMenu.css({
                      top : properties.pointer_y - 80 + 'px',
                      left : properties.pointer_x + 10 + 'px'
                  }).show();
              }
            }
          });

          window.timeline.on('hold', function(properties) {
            if (properties.item) {
              loadCTA(window.timeline.itemsData.get(properties.item.id));
              $('.rigth_menu').css({
                top : properties.pointer_y - 80 + 'px',
                left : properties.pointer_x + 10 + 'px'
              }).show();
            }
          });

          window.timeline.on('slideUp', function(properties) {
            if (properties) {
              changePageChannels(1);
            }
          });

          window.timeline.on('slideDown', function(properties) {
            if (properties) {
              changePageChannels(-1);
            }

          });

        }).done(function() {
        	if(callback){
        		callback();
        	}
            window.intervalFocus = setInterval(function() {
            var groupsId = window.timeline.itemSet.groupIds;
            var firstGroup = window.timeline.itemSet.groups[groupsId[0]];
            var first;
            if (firstGroup) {
              clearInterval(window.intervalFocus);
              $.each(firstGroup.visibleItems, function(i, item) {
                if (isLiveTv(item)) {
                  first = item;
                  return false;
                }
              });
              //
              if (first && first.data) {
                window.params.columnFocusDate = new Date(first.data.start);
                loadProgramInfo(first.data);
                window.timeline.setSelection(first.id);
              } else {
                $('.posterTitleContainer').hide();
              }

              document.onkeyup = function(event) {
                window.params.onKeyup(event);
              };
            } else{
              if (!window.timeline || !window.timeline.itemSet.groups) {
                return;
              }
            }
            renderLoadingGrid();
            renderFooter();
          }, 100);
        });
  });
};

function renderLoadingGrid(){
  var top = $('.vispanel.left').find('.content').offset().top;
  var left = $('.vispanel.center').find('.content').offset().left;
  var heightGrid = $('.vispanel.left').find('.content').height();
  $('.loadingProgramGrid').attr('style','top:' + (top) + 'px; left:' + (left) + 'px; height:' + heightGrid +'px;');
}

function loadingGrid(show){
  var loadingGridDiv = $('.loadingProgramGrid');
  if(show){
    loadingGridDiv.show();
  } else{
    loadingGridDiv.hide();
  }
}

function renderFooter(){
  var top = $('.vispanel.left').find('.content').offset().top;
  var heightGrid = $('.vispanel.left').find('.content').height();
  $('.footerGrid').attr('style','top:' + (top + heightGrid) + 'px; height:' + ($('.vispanel.left').height() - heightGrid) +'px;');
}


function loadProgramInfo(program) {

  var currentChannel = document.getElementById('current_channel');
  currentChannel.textContent = program.group + ' (CH)';

  var programTitle = document.getElementById('program_title');
  programTitle.textContent = program.metadata.title;

  var uriImg = window.config.config_ui.imageServer.replace("{programId}",program.metadata.programId);
  if(!window.poster){
    window.poster = true;
    $('#titlePoster').attr('src',uriImg).load(function() {
      $('.posterTitleContainer').hide();
    }).error(function() {
      $(this).attr('src','css/images/no_poster_available_v3.jpg');
      $('.posterTitleContainer').hide();
    });
  }else{
    var img = $('#titlePoster').attr('src');
    if(img != uriImg){
      $('#titlePoster').attr('src',uriImg);
    }else{
      $('.posterTitleContainer').hide();
    }

  }



  var programTime = document.getElementById('program_time');
  programTime.textContent = moment(program.start).format('MMM/D, h:mma') + " - " + moment(program.end).format('h:mma');

  var year = program.metadata.year;
  if (!_isEmpty(year) && year === moment.utc().format('YYYY')) {
    $('.new').text(year).show();
  } else {
    $('.new').hide();
  }

  var ratingTitle = getTvRating(program.metadata.tv_rating);
  if (_isEmpty(ratingTitle)) {
    $('.rating').hide()
  } else {
    $('.rating').text(ratingTitle).show()
  }

  var programDescription = document.getElementById('program_description');
  if (_isEmpty(program.metadata.description)) {
    programDescription.textContent = "";
  } else {
    programDescription.textContent = program.metadata.description;
  }
};

function getTvRating(intValueRating) {
  return window.tv_ratings[intValueRating].title;
};

function loadTvRating() {
  $.getJSON('config/tv_rating_mapping.json', function(data) {
    window.tv_ratings = data.tv_ratings;
  });
};

function _isEmpty(str) {
  return (!str || !str.length || str === 'null');
};

function loadCTA(item) {

  if (!item.metadata.status) {
    item.status = "EPG";
  } else {
    item.status = item.metadata.status;
  }

  var configMenuItems = jQuery.extend(true, {}, window.configGuide.infoScreenConfig.menuItem);
  var menuItemsArray = [];

  for ( var key in configMenuItems) {
    if (configMenuItems[key].status === item.status) {
      menuItemsArray = configMenuItems[key].menuActions;
      break;
    }
  }
  
  createContexMenu(item, menuItemsArray);
  
};

function tune(channel){
	var stationId = $(channel).find('.station').html();
	var contentVideo = $('#contentVideo');
	contentVideo.find('#current_channel').html(stationId + ' (CH)' );
	var channelInfo = timeline.groupsData.get(stationId);
	if(channelInfo.uri){
		hidePigVideo();
		window.playingLive = true;
		window.params.tunnedChannel = stationId;
		playVideo("http://" + channelInfo.uri);
	}
}

function stopLive(){
	hidePigVideo();
}

function loadChannelOptions(item) {
   var menuItemsArray = jQuery.extend(true, {}, window.configGuide.ChannelOptions);  
	  var ul = $('.rigth_menu ul');
	  ul.empty();
	  $.each(menuItemsArray, function(i, menu) {
		 if(menu.action !== 'stopLive' || (menu.action==='stopLive' && window.playingLive)){
		     var li = $('<li/>').bind('click', function() {
			        window[menu.action].apply(this, [item]);
			        hideRightMenu();
			     });
			     li.html(menu.title);
		         li.appendTo(ul);
		 }
	 });
};

function loadPigAction(item) {
	   var menuItemsArray = jQuery.extend(true, {}, window.configGuide.ChannelOptions);  
		  var ul = $('.rigth_menu ul');
		  ul.empty();
		  $.each(menuItemsArray, function(i, menu) {
			 if(menu.action === 'stopLive'){
			     var li = $('<li/>').bind('click', function() {
				        window[menu.action].apply(this, [item]);
				        hideRightMenu();
				     });
				     li.html(menu.title);
			         li.appendTo(ul);
			 }
		 });
	};

function createContexMenu(item, menuItemsArray){
	  var ul = $('.rigth_menu ul');
	  ul.empty();
	  $.each(menuItemsArray, function(i, menu) {
		 if(isMenuTitleValid(item, menu)){
			 var li = $('<li/>');
			  
			//adding subMenu		  
////			     li.addClass("dropdown-submenu");
////			     var a = $('<a/>');
////			     	a.attr("tabindex", "-1");
////			     	a.attr("href", "#");
////			     	a.html(menu.title);
////			     	a.appendTo(li);
////			     	createSubMenu(item, li, menu.subOptions);	
			 addElementEvent(li, menu, item);
		     li.html(menu.title);
		     li.appendTo(ul);
		 }	  
	  });
}

function addElementEvent(li, menu, item){
    li.bind('click', function() {
        window[menu.action].apply(this, [item]);
        hideRightMenu();
    });
}

function validateWasEmmited(item, menu){
	return !wasEmitted(timeline.itemSet.items[item.id]) || menu.show_wasEmitted == wasEmitted(timeline.itemSet.items[item.id]);
}

function isMenuTitleValid(item, menu){
  var isValid = false;
  var onlyFor = true;
  var program = timeline.itemSet.items[item.id];
  if(wasEmitted(program) && _.contains(menu.show_when, CONSTANTS.MENU_OPTION_ON_PAST)){
	  isValid = true;
  }else if(isLiveTv(program) && _.contains(menu.show_when, CONSTANTS.MENU_OPTION_ON_NOW)){
	  isValid = true;
  }else if(inFuture(program) && _.contains(menu.show_when, CONSTANTS.MENU_OPTION_ON_FUTURE)){
	  isValid = true;
  }
  if(menu.show_only && menu.show_only.length > 0){
	  onlyFor = validateMenuOptionOnlyFor(item, menu.show_only);
  }
  return isValid && onlyFor;
}


function validateIsPlaying(item){
 return (window.activePlaybackSession.recordingId) && (item.recordingId === window.activePlaybackSession.recordingId);
}

function createSubMenu(item, parent_li, titles){
 var subUl = $('<ul/>');
 subUl.addClass("dropdown-menu")
 subUl.appendTo(parent_li);
 for(var i=0;i<titles.length;i++){
	 var actionTriggered = titles[i].action;

	 var subUl_li = $('<li/>').bind('click', function (a, item){
		 return function() {
			 window[a].apply(this, [item]);
			 hideRightMenu();
		 };
	 }(actionTriggered,item));
	 subUl_li.appendTo(subUl);
	 var subUl_li_a1 = $('<a/>');
	 subUl_li_a1.attr("href", "#");
	 subUl_li_a1.html(titles[i].title);
	 subUl_li_a1.appendTo(subUl_li);
 }
}


function hideRightMenu(){
  $('.rigth_menu').hide();
}

function showPigVideo(){
  $('#contentVideo').show();
}

function hidePigVideo(){
  if(videojs.players.video_stream){
     if(!window.playingLive && window.activePlaybackSession.sessionId){
         clearTimeout(intervalKeepAlive);
    	 var payload = {};
    	 payload.status = "FINISHED";
    	 payload.offset = Math.floor(window.params.player.currentTime());
    	 var keepAliveInfo = {};
    	 keepAliveInfo.payload = payload;
    	 keepAliveInfo.sessionId = window.activePlaybackSession.sessionId;
    	 keepAliveInfo.recordingId = window.activePlaybackSession.recordingId;
    	 keepAliveInfo.type = window.activePlaybackSession.type;
    	 keepAliveInfo.userId = window.params.userSelected.id;
    	 keepAliveInfo.subscriberName = window.params.subscriberName;
    	 keepAliveInfo.recordingSetId = window.activePlaybackSession.recordingSetId;
    	 sendKeepAlive(keepAliveInfo);
    	 window.activePlaybackSession = {};
    	 window.programSelected = undefined; 
     }else{
       window.playingLive = false;
       window.params.tunnedChannel = undefined;
     }
     videojs.players.video_stream.dispose();
  }
  window.params.player = undefined;
  $('#contentVideo').hide();
}

function isLiveTv(program) {
  var now = new Date(timeline.getCurrentTime());
  if (now >= new Date(program.data.start) && now <= new Date(program.data.end)) {
    return true;
  }
  return false;
}

function wasEmitted(program) {
  var now = new Date(timeline.getCurrentTime());
  if (now > new Date(program.data.start) && now > new Date(program.data.end)) {
    return true;
  }
  return false;
}

function inFuture(program) {
  var now = new Date(timeline.getCurrentTime());
  if (now < new Date(program.data.start) && now < new Date(program.data.end)) {
    return true;
  }
  return false;
}

function removeWarningIcon(program, prevIcon, sizeH, sizeW) {
  var imgWarning = $(program.content).find('[id=warning]');
  if (imgWarning) {
    program.warning = undefined;
    window.timeline.itemsData.update(program);
    imgWarning.remove();
    addIconInProgram(program, sizeW + 'px', sizeH + 'px', prevIcon, "status");
  }
}

function removeUpdateIcon(program, prevIcon, sizeH, sizeW) {
	  var imgWarning = $(program.content).find('[id=update]');
	  if (imgWarning) {
	    program.warning = undefined;
	    window.timeline.itemsData.update(program);
	    imgWarning.remove();
	    addIconInProgram(program, sizeW + 'px', sizeH + 'px', prevIcon, "status");
	  }
	}


function handleUpdateProcess(program, prevIcon, sizePrevIcon){
	  var imgIcon = $(program.content).find('[id=status]').remove();
	  program.warning = 1;
	  window.timeline.itemsData.update(program);
	  var size = window.screen.availHeight * 0.016 * window.device.height_fact;
	  addImage(program.content,size + 'px',size + 'px','css/images/update.png', "update");
	  setTimeout(removeUpdateIcon.bind(this, program, prevIcon, sizePrevIcon, sizePrevIcon), 3000);
	  $('#modalInfoScreen').modal('hide');
}

function handleErrorProcess(program, prevIcon, sizePrevIcon){
  var imgIcon = $(program.content).find('[id=status]').remove();
  program.warning = 1;
  window.timeline.itemsData.update(program);
  var size = window.screen.availHeight * 0.016 * window.device.height_fact;
  addImage(program.content,size + 'px',size + 'px','css/images/errorRequest.png', "warning");
  setTimeout(removeWarningIcon.bind(this, program, prevIcon, sizePrevIcon, sizePrevIcon), 10000);
  $('#modalInfoScreen').modal('hide');
}

function scheduleSeriesOption(program) {
	window.programSelected = program;
	getSubscriberPreferences();
	if(!window.scheduleOptionFlag){
		createCTAScheduleOption(false, true);
		$('#modalScheduleOptions').modal('show');
	}else{
		sendScheduleWithOptions(series);
	}
} 

function scheduleSeries(subscriber, options) {
	var program = window.programSelected;
	// Test Monitor
	var msgObj = {};
	msgObj.className = "dataMonitorMsg";
	msgObj.msg = "Schedule serie: " + program.metadata.title + ", airingId: "	+ program.metadata.airingId  + ", seriesId: "	+ program.metadata.altSeries;
	reportActivity(msgObj);
	// Test Monitor------------------------------
	var scheduledProg = {
		metadata : program.metadata
	};
	var userId = window.params.userSelected.id;
	var deferred = scheduleSerieProgram(subscriber, userId, scheduledProg, options);
	$.when(deferred).done(
			function(data) {
				if ((data && data.ERROR) || (data && data.status.state === "ERROR")) {
					showAlert(CONSTANTS.ALERT_DANGER, 'Schedule series has failed, please try again.');
					informErrorActivity(data);
				} else {
					showAlert(CONSTANTS.ALERT_SUCCESS, 'Series scheduled.');
					informSuccessActivity(data);
				}
				updateQuota(data);
				$('#modalInfoScreen').modal('hide');
				window.programSelected = undefined;
			});
}

function getSubscriberPreferences(){
	  //Test Monitor
	  var msgObj = {};
	  msgObj.className = "dataMonitorMsg";
	  msgObj.msg= "getting subsciber preferences: " + window.params.subscriberName;
	  reportActivity(msgObj);
	  //Test Monitor------------------------------
	  var deferred = subscriberPreferences(window.params.subscriberName, false);
	  $.when(deferred).done(function(data) {
	    if((data && data.ERROR)){
	    	informErrorActivity(data)
	    	window.scheduleOption_startOffset_index = 0;
		    window.scheduleOption_endOffset_index = 0;
		    window.scheduleOption_keep_index = 0;
		    window.scheduleOption_accept_index = 0;
	    }else{
	      informSuccessActivity(data);
	      if(data.startOffset){
	    	  window.scheduleOption_startOffset_index = _.indexOf(window.configGuide.ScheduleOptions[0].internalValues, data.startOffset);
	      }else{
	    	  window.scheduleOption_startOffset_index = 0;
	      }
	      if(data.endOffset){
	    	  window.scheduleOption_endOffset_index = _.indexOf(window.configGuide.ScheduleOptions[1].internalValues, data.endOffset);
	      }else{
	    	  window.scheduleOption_endOffset_index = 0;
	      }
	      if(data.spaceConflictPolicy){
	    	  window.scheduleOption_keep_index = _.indexOf(window.configGuide.ScheduleOptions[2].internalValues, data.spaceConflictPolicy);
	      }else{
	    	  window.scheduleOption_keep_index = 0;
	      }
	      if(data.accept){
	    	  window.scheduleOption_accept_index = _.indexOf(window.configGuide.ScheduleOptions[3].internalValues, data.accept);
	      }else{
	    	  window.scheduleOption_accept_index = 0;
	      }
	    }
	  });
}

function recordingOptions(program) {
	var modifyRecordingOpt = true;
	window.programSelected = program;
    window.scheduleOption_startOffset_index = _.indexOf(window.configGuide.ScheduleOptions[0].internalValues, program.recOptions.startOffset);
    window.scheduleOption_endOffset_index = _.indexOf(window.configGuide.ScheduleOptions[1].internalValues, program.recOptions.endOffset);
    window.scheduleOption_keep_index = _.indexOf(window.configGuide.ScheduleOptions[2].internalValues, program.recOptions.spaceConflictPolicy);
	createCTAScheduleOption(modifyRecordingOpt);
	$('#modalScheduleOptions').modal('show');
}


function scheduleProg(program) {
	window.programSelected = program;
	getSubscriberPreferences();
	if(!window.scheduleOptionFlag){
		createCTAScheduleOption();
		$('#modalScheduleOptions').modal('show');
	}else{
		sendScheduleWithOptions();
	}
}

function scheduleProgramWithOptions(subscriber, options){
	  var program = window.programSelected;
	  //Test Monitor
	  var msgObj = {};
	  msgObj.className = "dataMonitorMsg";
	  msgObj.msg= "Schedule program: " + program.metadata.title + ", airingId: " + program.metadata.airingId;
	  reportActivity(msgObj);
	  //Test Monitor------------------------------
	  var scheduledProg = {metadata : program.metadata};
	  var size = window.screen.availHeight * 0.016 * window.device.height_fact;
	  addIconInProgram(program, size + 'px', size + 'px', 'css/images/arrow-circle.png', "status");
	  var userId = window.params.userSelected.id;
	  var deferred = scheduleProgram(subscriber, userId, scheduledProg, options);
	  $.when(deferred).done(function(data) {
	    if((data && data.ERROR) || (data && data.status.state != "SCHEDULED" && data.status.state != "CAPTURING")){
	      showAlert(CONSTANTS.ALERT_DANGER, 'Schedule has failed, please try again.');
	      informErrorActivity(data);
	      var size = window.screen.availHeight * 0.016 * window.device.height_fact;
	      handleErrorProcess(program, '', 0);
	    }else{
	      showAlert(CONSTANTS.ALERT_SUCCESS, 'Program Scheduled.');
	      informSuccessActivity(data);
	      if(data.status.state === "SCHEDULED"){
              size = window.screen.availHeight * 0.016 * window.device.height_fact;
              addIconInProgram(program, size + 'px', size + 'px', 'css/images/clock.png', "status");
              program.status = "SCHEDULED";
              program.metadata.status="SCHEDULED";

	      }else{
	          size = window.screen.availHeight * 0.015 * window.device.height_fact;
	          addIconInProgram(program, size + 'px', size + 'px', 'css/images/red_dot_icon.png', "status");
	          program.status = "CAPTURING";
	          program.metadata.status="CAPTURING";
	      }
	      window.timeline.itemsData.update(program);
	    }
	    $('#modalInfoScreen').modal('hide');
	    window.programSelected = undefined;
	    loadItemsNdvr(true, updateGuideProgramStatus.bind(this));
	  });
}

function modifyRecordingOptions(subscriber, options){
	  var options = options;
	  var program = window.programSelected;
	  var obj = undefined;
	  if(program.metadata.type==="episode"){
		  obj = findEpisode(program.metadata.airingId);
		  obj.recordingSetId = program.metadata.seriesId + ";" + program.metadata.channel;
		  obj.recordingSetType = "series";
	  }else{
		  obj = _.findWhere(window.ndvrItems.allItems, {airingId : program.metadata.airingId});
		  obj.recordingSetId = "personal";
		  obj.recordingSetType = "programs";
	  }
	  //Test Monitor
	  var msgObj = {};
	  msgObj.className = "dataMonitorMsg";
	  msgObj.msg= "Modifying program options: " + program.metadata.title + ", Event Id: " + obj.id;
	  reportActivity(msgObj);
	  var imgIcon = $(program.content).find('[id=status]')[0].attributes[1].nodeValue;
	  var size = window.screen.availHeight * 0.016 * window.device.height_fact;
	  handleUpdateProcess(program, imgIcon, size);
	  //Test Monitor---------------------------------
	  var subscriber = window.params.subscriberName;
	  var userId = window.params.userSelected.id;
	  var deferred = modifyRecOptions(subscriber, userId, obj.recordingSetType, obj.recordingSetId, obj.id, options);
	  $.when(deferred).done(function(data) {
	    if(data && data.ERROR){
	      informErrorActivity(data);
	    }else{
		  informSuccessActivity(data);
		  setNewOptions(options);
	    }
	    loadItemsNdvr(true, updateGuideProgramStatus.bind(this));
		   $('#modalInfoScreen').modal('hide');
		   window.programSelected = undefined;
	  });
}


function setNewOptions(options){
	$.each( options, function( key, value ) {
		 window.programSelected.recOptions[key] = value;
    });
	window.timeline.itemsData.update(window.programSelected);
}

function cancelScheduleProg(program) {
  //Test Monitor
  var msgObj = {};
  msgObj.msg= "cancel program: " + program.metadata.title + ", airingId: " + program.metadata.airingId;
  msgObj.className = "dataMonitorMsg";
  reportActivity(msgObj);
  //Test Monitor------------------------------
  if(program.metadata.type==="episode"){
	  obj = findEpisode(program.metadata.airingId);
	  if(obj){
		 obj.recordingSetId = program.metadata.seriesId + "+" + program.metadata.channel;
		 obj.recordingSetType = "series";  
      }else{
    	  showAlert(CONSTANTS.ALERT_DANGER, 'cancel recording has failed, please try again.');
		return;
	  }
  }else{
	  obj = _.findWhere(window.ndvrItems.allItems, {airingId : program.metadata.airingId});
	  if(obj){
		obj.recordingSetId = "personal";
		obj.recordingSetType = "programs";  
	  }else{
		  showAlert(CONSTANTS.ALERT_DANGER, 'cancel recording has failed, please try again.');
		return;
	  }
  }
  var size = window.screen.availHeight * 0.016 * window.device.height_fact;
  addIconInProgram(program, size + 'px', size + 'px', 'css/images/arrow-circle.png', "status");
  var img = $(program.content).find('img');
  img.addClass('cancel_refresh');
  window.timeline.itemsData.update(program);
  deleteRecord(obj, function(canceled, data) {
    cleanInterval();
    showAlert(CONSTANTS.ALERT_SUCCESS, 'Recording cancelled.');
    informSuccessActivity(data);
    removeEpisodeFromSeries(program.metadata.airingId);
    removeIconProgram(program);
    updateQuota(data);
    $('#modalInfoScreen').modal('hide');
  }, function(data){
    if(data && data.ERROR){
      showAlert(CONSTANTS.ALERT_DANGER, 'cancel recording has failed, please try again.');
      informErrorActivity(data);
      var size = window.screen.availHeight * 0.016 * window.device.height_fact;
      handleErrorProcess(program, 'css/images/clock.png', size);
      updateQuota(data);
    }
  });
}

function stopProg(program){
  //Test Monitor
  var msgObj = {};
  msgObj.msg= "stop recording: " + program.metadata.title + ", airingId: " + program.metadata.airingId;
  msgObj.className = "dataMonitorMsg";
  reportActivity(msgObj);
  //Test Monitor------------------------------
  if(program.metadata.type==="episode"){
	  obj = findEpisode(program.metadata.airingId);
	  if(obj){
		 obj.recordingSetId = program.metadata.seriesId + "+" + program.metadata.channel;
		 obj.recordingSetType = "series";  
	  }else{
		showAlert(CONSTANTS.ALERT_DANGER, 'stop recording has failed, please try again.');
		return;
	  }
  }else{
	  obj = _.findWhere(window.ndvrItems.allItems, {airingId : program.metadata.airingId});
	  if(obj){
		obj.recordingSetId = "personal";
		obj.recordingSetType = "programs";  
	  }else{
		showAlert(CONSTANTS.ALERT_DANGER, 'stop recording has failed, please try again.');
		return;
	  }
  }
  var size = window.screen.availHeight * 0.016 * window.device.height_fact;
  addIconInProgram(program, size + 'px', size + 'px', 'css/images/arrow-circle.png', "status");
  sendStopRecording(obj, function(ctx, listItem, data) {
    cleanInterval();
    showAlert(CONSTANTS.ALERT_SUCCESS, 'Recording stopped.');
    informSuccessActivity(data);
    program.status = "COMPLETED";
    program.metadata.status="COMPLETED";
    size = window.screen.availHeight * 0.016 * window.device.height_fact;
    addIconInProgram(program, size + 'px', size + 'px', 'css/images/player_play.png', "status");
    window.timeline.itemsData.update(program);
    updateQuota(data);
    $('#modalInfoScreen').modal('hide');
  }, null,function(data){
    if(data && data.ERROR){
      showAlert(CONSTANTS.ALERT_DANGER, 'stop recording has failed, please try again.');
      informErrorActivity(data);
      var size = window.screen.availHeight * 0.015 * window.device.height_fact;
      handleErrorProcess(program, 'css/images/red_dot_icon.png', size);
      loadItemsNdvr(true, updateGuideProgramStatus.bind(this));
    }
  });
}

function reschedule(program){
	window.programSelected = program;
	deleteProg(program, reScheduleCallback);

}

var reScheduleCallback  = function(){
	sendScheduleWithOptions();
}

function deleteProg(program, callback){
  //Test Monitor
  if(!window.playingLive){
    hidePigVideo();  
  }
  var msgObj = {};
  msgObj.msg= "Delete recording: " + program.metadata.title + ", airingId: " + program.metadata.airingId;
  msgObj.className = "dataMonitorMsg";
  reportActivity(msgObj);
  //Test Monitor------------------------------
  if(program.metadata.type==="episode"){
	  obj = findEpisode(program.metadata.airingId);
	  if(obj){
	     obj.recordingSetId = program.metadata.seriesId + "+" + program.metadata.channel;
	     obj.recordingSetType = "series";  
	  }else{
		showAlert(CONSTANTS.ALERT_DANGER, 'delete recording has failed, please try again.');
		return;
	  }
  }else{
	  obj = _.findWhere(window.ndvrItems.allItems, {airingId : program.metadata.airingId});
	  if(obj){
		obj.recordingSetId = "personal";
		obj.recordingSetType = "programs";  
	  }else{
		showAlert(CONSTANTS.ALERT_DANGER, 'delete recording has failed, please try again.');
		return;
	  }
  }
  var size = window.screen.availHeight * 0.016;
  addIconInProgram(program, size + 'px', size + 'px', 'css/images/arrow-circle.png', "status");
  var img = $(program.content).find('img');
  img.addClass('delete_refresh');
  deleteRecord(obj, function(deleted,data) {
    cleanInterval();
    showAlert(CONSTANTS.ALERT_SUCCESS, 'Recording deleted.');
    informSuccessActivity(data);
    removeEpisodeFromSeries(program.metadata.airingId);
    removeIconProgram(program);
    updateQuota(data);
    $('#modalInfoScreen').modal('hide');
    if(callback){
    	callback();
    }
  }, function(data){
    if(data && data.ERROR){
      showAlert(CONSTANTS.ALERT_DANGER, 'delete recording has failed, please try again.');
      informErrorActivity(data);
      var size = window.screen.availHeight * 0.016 * window.device.height_fact;
      handleErrorProcess(program, 'css/images/player_play.png', size);
      loadItemsNdvr(true, updateGuideProgramStatus.bind(this));
    }
  });
}

function addIconInProgram(program, w, h, src, type) {
  addImage(program.content, w, h, src, type);
}

function removeIconProgram(program){
    var imgIcon = $(program.content).find('#status');
    imgIcon.remove();
    program.metadata.status = "EPG";
    program.status = "EPG";
}

function addIconInChannel(channel, w, h, src, type) {
  var divIcon = $(channel.content).find('[id=' + type + ']');
    addImage(divIcon[0], w, h, src, type + 'icon');
}

function updateGuideProgramStatus() {
  if(!window.timeline || !window.timeline.itemsData){
    return;
  }
  var ids = window.timeline.itemsData.getIds();
  $.each(ids, function(i, id) {
    var program = window.timeline.itemsData.get(id);
    var progamObj = _.findWhere(window.ndvrItems.allItems, {airingId : program.metadata.airingId});
    if(!progamObj){
    	progamObj = findEpisode(program.metadata.airingId);
    	if(progamObj){
  		   program.metadata.type = "episode";
  		}
    }
    
    var imgIcon = $(program.content).find('#status');

    if (progamObj) {
      if ((progamObj.status != program.status) || (program.status != "EPG" ) && (!program.warning)) {
        program.status = progamObj.status;
        program.recOptions = progamObj.options;
        program.metadata.status = progamObj.status;
        program.metadata.type = (!program.metadata.type)?"regular":program.metadata.type;
        if (program && program.content.children ) {
          var size = undefined;
          switch (program.status) {
            case "RECEIVED":
            case "SCHEDULED":
              size = window.screen.availHeight * 0.016 * window.device.height_fact;
              addIconInProgram(program, size + 'px', size + 'px', 'css/images/clock.png', "status");
              break;
            case "CAPTURING":
              size = window.screen.availHeight * 0.015 * window.device.height_fact;
              addIconInProgram(program, size + 'px', size + 'px', 'css/images/red_dot_icon.png', "status");
              break;
            case "COMPLETED":
              size = window.screen.availHeight * 0.016 * window.device.height_fact;
              addIconInProgram(program, size + 'px', size + 'px', 'css/images/player_play.png', "status");
              break;
            case "ERROR":
                size = window.screen.availHeight * 0.016 * window.device.height_fact;
                addIconInProgram(program, size + 'px', size + 'px', 'css/images/errorRequest.png', "status");
                break;
            case "CONFLICT":
                size = window.screen.availHeight * 0.016 * window.device.height_fact;
                addIconInProgram(program, size + 'px', size + 'px', 'css/images/conflict.png', "status");
                break;
            default:
              imgIcon.remove();
              program.metadata.status = "EPG";
              program.status = "EPG";
              break;
          }
        }
        window.timeline.itemsData.update(program);
      }
    } else {
      if (program.programType!="CATCHUP_TV" && (imgIcon.attr('src') && imgIcon.attr('src').length && imgIcon.attr('src') != 'css/images/arrow-circle.png') || (imgIcon && imgIcon.hasClass('cancel_refresh')) || (imgIcon && imgIcon.hasClass('delete_refresh'))) {
        imgIcon.remove();
        program.metadata.status = "EPG";
        program.status = "EPG";
        window.timeline.itemsData.update(program);
      }
    }
  });
}

function checkRecordingType(program){
	if(!program.metadata.type){
		
	}
}

function showCurrentTime() {
  var ct = document.getElementById('current_time');
  ct.textContent = moment(new Date()).format("HH:mm");
};

/*
* VIDEO JS
*/

function startOver(program){
	preview(program, CONSTANTS.FEATURE_START_OVER);
}


function preview(program, feature){
  window.programSelected = program;
  var sessionData = {};
  sessionData.payload = {};
  sessionData.subscriberName = window.params.subscriberName;
  sessionData.deviceName = "STB_" + window.params.subscriberName;
  sessionData.type = program.programType;
  sessionData.userId = window.params.userSelected.id;
  var programObj = {};
  var recordingId = undefined;
  if(program.programType === CONSTANTS.CATCHUP_TV_TYPE){
	  sessionData.recordingSetId = (program.recordingSetId)?program.recordingSetId : undefined;
	  recordingId = sessionData.recordingId = program.metadata.airingId; 
	  setOffsetByFeature(feature, sessionData, program);
  }else{
	  if (program.metadata.type === "episode") {
		  programObj = findEpisode(program.metadata.airingId);
	  }else {
		  programObj = _.findWhere(window.ndvrItems.allItems, {airingId : program.metadata.airingId});
	  }
	  recordingId = sessionData.recordingId = programObj.id;
  }
  
  if(window.activePlaybackSession.recordingId !== recordingId){
	  if(!_.isUndefined(window.params.deviceSelected.id) || window.params.deviceSelected.id != "0"){
		  sessionData.payload.deviceId = window.params.deviceSelected.id;	  
	  }
	  if(!_.isUndefined(programObj.bookmarkOffset)){
		  sessionData.payload.offset = item.bookmarkOffset;
	  }
	  //Test Monitor
	  var msgObj = {};
	  msgObj.msg= "Get playback session recording: " + program.metadata.title + ", airingId: " + program.metadata.airingId;
	  msgObj.className = "dataMonitorMsg";
	  reportActivity(msgObj);
	  //Test Monitor------------------------------
	  var deferred = getPlaySession(sessionData);
	  $.when(deferred).done(function(responseSession) {
	    if(responseSession.info && responseSession.info.ERROR){
	      showAlert(CONSTANTS.ALERT_DANGER, 'playback recording has failed, please try again.');
	      informErrorActivity(responseSession.info);
	    }else{
	      informSuccessActivity(responseSession.info);
	      var parseUrl = playbackUrl = responseSession.info.playbackUri;
	      window.activePlaybackSession = responseSession.info;
	      window.activePlaybackSession.subscriberId = window.params.subscriberName;
	      window.activePlaybackSession.device = window.params.deviceSelected
	      window.activePlaybackSession.type = sessionData.type;
	      window.activePlaybackSession.recordingSetId = sessionData.recordingSetId;	      
	      
	      if(isResumeAt(feature, responseSession)){
	    	  window.keepAliveFixedValue = true;
	    	  window.activePlaybackSession.timeElapsed = responseSession.info.offset;
	    	  createResumeDialog(window.activePlaybackSession.timeElapsed, playbackUrl, window.programSelected);
	      }else{
	    	  window.keepAliveFixedValue = false;
	    	  setTimeElapsedActiveSession(sessionData);
	    	  playbackUrl = responseSession.info.playbackUri;
	    	  if(window.playingLive){
	    	    hidePigVideo();  
	    	  }
	    	  playVideo(playbackUrl);
	      }
	      createKeepAliveInterval();
	    }
	    $('#modalInfoScreen').modal('hide');
	  });
  }
}

function isResumeAt(feature, responseSession){
  return (feature !== CONSTANTS.FEATURE_START_OVER && !window.playingLive && responseSession.info.offset && responseSession.info.offset>0);
}

function createResumeDialog(valueWatched, playbackUrl, program){
	var totalMinutes = getRecordingDuration(program.start, program.end);
	var timeWatched = getMinutesWatched(valueWatched);
	var timeInMinutes = getTimeInMin(valueWatched);
	var percentage = (timeInMinutes * 100)/totalMinutes;
	var result = percentage.toFixed(1);
	var progressBarResume = $('#modalResumeAt').find('#progressBarResume');
	progressBarResume.attr('aria-valuenow', result);
	progressBarResume.attr('style',"width:" + result + "%");
	var totalVideo = $('#totalTime');
	var totalToShow = getTotalTime(totalMinutes*60);
	totalVideo.html(totalToShow);
	var totalWatched = $('#watched');
	totalWatched.html(timeWatched);
	var buttonResume = $('#resumeVideo');
    if(window.playingLive){
        hidePigVideo();  
    }
	buttonResume.bind('click', function(){
		window.keepAliveFixedValue = false;
	    showPigVideo();
		playVideo(playbackUrl);
		$('#modalResumeAt').modal('hide');
	});
	var buttonRestart = $('#restartViedo');
	buttonRestart.bind('click', function(){
		window.activePlaybackSession.timeElapsed = 0;
		window.keepAliveFixedValue = false;
	    showPigVideo();
		playVideo(playbackUrl);
		$('#modalResumeAt').modal('hide');
	});
	$('#modalResumeAt').modal('show');
}

function playVideo(videoUrl) {
 //videoUrl = "http://10.184.15.101:18082/9cad0c4619634de68a2550b76914c0ee.m3u8";
  var playingType = "Recording";
  var contentVideo = $('#contentVideo');
  if(window.playingLive){
	playingType = "Live";
  }else{
	  contentVideo.find('#current_channel').html(" ");
  }
  contentVideo.find('#assetType').html(playingType);
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
        'preload': 'auto'
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
  window.params.player = videojs('video_stream', options, function() {
    this.src({
      type: 'application/x-mpegURL',
      src: videoUrl
    });
  });
  
  window.params.player.on("loadedmetadata", setPlayerPosition);
  window.params.player.on('error', function(){handleError(hidePigVideo);});
 
  window.params.player.on("pause", function(event){
      event.preventDefault();
      var currentOffset = 0;
      if(window.playingLive){
    	  if(serviceHasFeature(CONSTANTS.FEATURE_PAUSE_LIVE_TV)){
        	  window.params.player.on("play", playAfterPauseLive);  
    	  }else{
    		  showAlert(CONSTANTS.ALERT_DANGER, 'PAUSE LIVE TV IS NOT AVAILABLE.');
    		  window.params.player.play();
    	  }
      }else{
    	currentOffset = Math.floor(window.params.player.currentTime());
        notifyTrickPlayEvent(CONSTANTS.TRICK_PLAY_EVENT_PAUSE, window.activePlaybackSession, currentOffset);
      }
  });
  
}

/*
* END VIDEO JS
*/

/*
* MODAL INFO SCREEN
*/
function infoProg(program) {
  loadModalInfoScreen(program);
  loadCallToActionsModal(program);
  $('#modalInfoScreen').modal('show');
};

function loadInfoPosterAsync(element, programId){
  //Try on Internet
  $(element).attr('src','posterImage/'+ programId + '.jpg').error(function() {
    $(element).unbind('error');
    loadInfoPosterRetry(element,programId)
  });
}

function loadInfoPosterRetry(element, programId){
  var url = config.config_ui.imageServer.replace("{programId}", programId);
  $(element).attr('src',url).error(function() {
    $(this).attr('src','css/images/no_poster_available_v3.jpg');
  });
}

function loadModalInfoScreen(program) {
  var programTitle = document.getElementById('modalInfoScreen_title');
  programTitle.textContent = program.metadata.title;

  loadInfoPosterAsync('#modalInfoScreen_program_poster', program.metadata.programId);

  var programTime = document.getElementById('modalInfoScreen_program_time');
  programTime.textContent = moment(program.start).format('MMM/D, h:mma') + " - " + moment(program.end).format('h:mma');

  var year = program.metadata.year;
  if (!_isEmpty(year) && year === moment.utc().format('YYYY')) {
    $('#modalInfoScreen_body .new').text(year).show();
  } else {
    $('#modalInfoScreen_body .new').hide();
  }

  var ratingTitle = getTvRating(program.metadata.tv_rating);
  if (_isEmpty(ratingTitle)) {
    $('#modalInfoScreen_body .rating').hide()
  } else {
    $('#modalInfoScreen_body .rating').text(ratingTitle).show()
  }

  var programDescription = document.getElementById('modalInfoScreen_program_description');
  if (_isEmpty(program.metadata.description)) {
    programDescription.textContent = "";
  } else {
    programDescription.textContent = program.metadata.description;
  }
};

function loadCallToActionsModal(program) {
  if (!program.metadata.status) {
    program.status = "EPG";
  } else {
    program.status = program.metadata.status;
  }

  var menuItems = window.configGuide.infoScreenConfig.menuItem;
  var buttons = [];
  for (i = 0, len = menuItems.length; i < len; ++i) {
    if (program.status === menuItems[i].status) {
      buttons = menuItems[i].menuActions;
      break;
    }
  }
  var modalFooter = $('.modal-footer');
  modalFooter.empty();
  var btnElement = null, txt = null;
  // len - 1 -> "Info" title doesn't matter
  for (var i = 0, len = buttons.length; i < len - 1; ++i) {
    button = buttons[i];
    if (!wasEmitted(timeline.itemSet.items[program.id]) || button.show_wasEmitted === wasEmitted(timeline.itemSet.items[program.id])) {
      btnElement = document.createElement("button");
      txt = document.createTextNode(button.title);
      btnElement.appendChild(txt);

      btnElement.btnaction = button.action;
      btnElement.program = program;
      btnElement.addEventListener('click', function(evt) {
        window[evt.target.btnaction].call(undefined, evt.target.program);
      });

      btnElement.className = 'btn btn-info';
      modalFooter.append(btnElement);
    }

  }
  btnElement = document.createElement("button");
  txt = document.createTextNode('Close');
  btnElement.appendChild(txt);
  btnElement.className = 'btn btn-default';
  btnElement.setAttribute('data-dismiss', 'modal')
  modalFooter.append(btnElement);
};

function getOptions(series){
	 var options = {};
	 if((window.programSelected.status!=="CAPTURING" && window.programSelected.status!=="COMPLETED") && (!(isLiveTv(window.programSelected) && window.programSelected.status==="EPG"))){
		 options.startOffset = window.configGuide.ScheduleOptions[0].internalValues[window.scheduleOption_startOffset_index];
	 }
	 options.spaceConflictPolicy = window.configGuide.ScheduleOptions[2].internalValues[window.scheduleOption_keep_index];
	 if(window.programSelected.status!=="COMPLETED"){
		 options.endOffset = window.configGuide.ScheduleOptions[1].internalValues[window.scheduleOption_endOffset_index];
	 }
	 if(series){
		 options.accept = window.configGuide.ScheduleOptions[3].internalValues[window.scheduleOption_accept_index];
	 }
	 
	 return options;
}

function sendScheduleWithOptions(series){
	 var options = getOptions(series);
	 hideScheduleOptionPopup();
	 if(!series){
		scheduleProgramWithOptions(window.params.subscriberName, options);
	 }else{
		 options.episodeLimit = "UNLIMITED";
		 scheduleSeries(window.params.subscriberName, options);
		 window.seriesAcceptOption = undefined;
	 }
}

function sendModifyRecOptions(){
	 var options = getOptions();
	 hideScheduleOptionPopup();
	 if(!window.seriesAcceptOption){
		 modifyRecordingOptions(window.params.subscriberName, options);
	 }else{
		 options.episodeLimit = "UNLIMITED";
		 options.accept = window.seriesAcceptOption;
		 scheduleSeries(window.params.subscriberName, options);
		 window.seriesAcceptOption = undefined;
	 }
}

function hideScheduleOptionPopup(){
	$('#modalScheduleOptions').modal('hide');
	$("input[name='Start']").TouchSpin('destroy');
	$("input[name='End']").TouchSpin('destroy');
	$("input[name='Keep']").TouchSpin('destroy');
}


function createCTAScheduleOption(modify, typeSeries) {
	 $('#sendOptions').unbind();
	 $('#checkBoxAsk').unbind();
	 $('#sendDefault').unbind();
	 
	 if(typeSeries){
		 addAcceptSpinin();
	 }else{
		 removeAcceptSpinin();
	 } 

	 $("input[name='Start']").TouchSpin({
	      verticalbuttons: false,
	      itemName:'Start',
	      buttondown_class:'increment_Button',
	      buttonup_class:'increment_Button',
	      inputClass:'inputSkin',
	      initval: window.configGuide.ScheduleOptions[0].friendMsg[window.scheduleOption_startOffset_index],
	      initIndex : window.scheduleOption_startOffset_index,
	      min: window.configGuide.ScheduleOptions[0].friendMsg[0],
	      arrayValue: window.configGuide.ScheduleOptions[0].friendMsg,
          max: window.configGuide.ScheduleOptions[0].friendMsg[window.configGuide.ScheduleOptions[0].friendMsg.length-1]
	 });

	 $("input[name='End']").TouchSpin({
	      verticalbuttons: false,
	      itemName:'End',
	      buttondown_class:'increment_Button',
	      buttonup_class:'increment_Button',
	      inputClass:'inputSkin',
	      initval: window.configGuide.ScheduleOptions[1].friendMsg[window.scheduleOption_endOffset_index],
	      initIndex : window.scheduleOption_endOffset_index,
	      min: window.configGuide.ScheduleOptions[1].friendMsg[0],
	      arrayValue: window.configGuide.ScheduleOptions[1].friendMsg,
	      max: window.configGuide.ScheduleOptions[1].friendMsg[window.configGuide.ScheduleOptions[1].friendMsg.length-1]
	 });

	 $("input[name='Keep']").TouchSpin({
	      verticalbuttons: false,
	      itemName:'Keep',
	      buttondown_class:'increment_Button',
	      buttonup_class:'increment_Button',
	      inputClass:'inputSkin',
	      initval: window.configGuide.ScheduleOptions[2].friendMsg[window.scheduleOption_keep_index],
	      initIndex : window.scheduleOption_keep_index,
	      min: window.configGuide.ScheduleOptions[2].friendMsg[0],
	      arrayValue: window.configGuide.ScheduleOptions[2].friendMsg,
	      max: window.configGuide.ScheduleOptions[2].friendMsg[window.configGuide.ScheduleOptions[2].friendMsg.length-1]
	 });

	 window.programSelected.data = {};
     window.programSelected.data.start = window.programSelected.start;
     window.programSelected.data.end = window.programSelected.end;

     if(window.programSelected.status==="CAPTURING" || (isLiveTv(window.programSelected) && window.programSelected.status==="EPG")){
    	 disableStartSpinin(true);
    	 disableEndSpinin(false);
	 }else if(window.programSelected.status==="COMPLETED"){
		 disableStartSpinin(true);
		 disableEndSpinin(true);
	 }else{
	 	 disableStartSpinin(false);
    	 disableEndSpinin(false);
	 }

	 if(!modify){
		 $('.checkbox-inline').show();
		 $('#sendOptions').click(function(event){
			 sendScheduleWithOptions(typeSeries);
			 event.stopPropagation();
	         event.stopImmediatePropagation();

		 });

		 $('#checkBoxAsk').click(function(event){
			 window.scheduleOptionFlag = $('#checkBoxAsk')[0].checked;
			 event.stopPropagation();
	         event.stopImmediatePropagation();
		 });

	 }else{
		 $('.checkbox-inline').hide();
		 $('#sendOptions').click(function(event){
			 sendModifyRecOptions();
			 event.stopPropagation();
	         event.stopImmediatePropagation();
		 });
	 }

	 $('#sendDefault').click(function(){
		 event.stopPropagation();
         event.stopImmediatePropagation();
         hideScheduleOptionPopup();
	 });

}

function removeAcceptSpinin(){
	 window.seriesAcceptOption = undefined;
	 var divContent = $('#containerSchedule');
	 var dinamicRow = divContent.find("#dinamicRow");
	 if(dinamicRow.length>0){
		 dinamicRow.remove();
		 $('.modalOption-content').css({"height": "240px"});
		 $('.modalScheduleOption-footer').css({"padding-top" : "12px"});
		 $('#scheduleOpHeader').html("Recording Options");
	 }
}

function addAcceptSpinin(){
	var divContent = $('#containerSchedule');
	var acceptInitialized = divContent.find("#" + window.configGuide.ScheduleOptions[3].title);
	if(acceptInitialized.length==0){
		 //divContent.attr("class", "modalContentOption");
		 var row = $('<div/>');
		 row.attr("id", "dinamicRow");
		 row.attr("class", "row");
		 row.appendTo(divContent);
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
		 input.attr("id", window.configGuide.ScheduleOptions[3].title);
		 input.attr("type", "text");
		 input.attr("value", "");
		 input.attr("readonly", "readonly");
		 input.attr("name", window.configGuide.ScheduleOptions[3].title);
		 input.appendTo(col2);
		 $('.modalOption-content').css({"height": "290px"});
		 $('.modalScheduleOption-footer').css({"padding-top" : "64px"});
		 	
		 $("input[name='" + window.configGuide.ScheduleOptions[3].title+ "']").TouchSpin({
		      verticalbuttons: false,
		      itemName: window.configGuide.ScheduleOptions[3].title,
		      buttondown_class:'increment_Button',
		      buttonup_class:'increment_Button',
		      inputClass:'inputSkin',
		      initval: window.configGuide.ScheduleOptions[3].friendMsg[window.scheduleOption_accept_index],
		      initIndex : window.scheduleOption_accept_index,
		      min: window.configGuide.ScheduleOptions[3].friendMsg[0],
		      arrayValue: window.configGuide.ScheduleOptions[3].friendMsg,
	         max: window.configGuide.ScheduleOptions[3].friendMsg[window.configGuide.ScheduleOptions[3].friendMsg.length-1]
		 });
		 $('#scheduleOpHeader').html("Series Options");
	 }
}

function disableStartSpinin(valueDisabled){
	 $("input[name='Start']").prop('disabled', valueDisabled);
	 if(valueDisabled){
		 $("input[name='Start']").attr('class', 'form-control inputSkin disabled');
		 $("span[id='Start']").attr('class', 'labelIncremental disabled');
	 }else{
		 $("input[name='Start']").attr('class', 'form-control inputSkin');
		 $("span[id='Start']").attr('class', 'labelIncremental');
	} 
}


function disableEndSpinin(valueDisabled){
	 $("input[name='End']").prop('disabled', valueDisabled);
	 if(valueDisabled){
		 $("input[name='End']").attr('class', 'form-control inputSkin disabled');
		 $("span[id='End']").attr('class', 'labelIncremental disabled');
	 }else{
		 $("input[name='End']").attr('class', 'form-control inputSkin');
		 $("span[id='End']").attr('class', 'labelIncremental');
	} 
}



/*
* END MODAL INFO SCREEN
*/
