function getChannelList(subscriber) {
  var msg = "{'actionService': 'GUIDE_CHANNEL_DATA', 'subscriberName' : '" + subscriber + "'}";
  return $.ajax({
    async : true,
    type : "POST",
    url : "ServerService",
    contentType : 'application/json',
    mimeType : 'application/json',
    data : msg
  });

}

function getInitProgramGuide(subscriber) {
  var msg = "{'actionService': 'GUIDE_PROGRAM_DATA', 'subscriberName' : '" + subscriber + "'}";
  return $.ajax({
    async : true,
    type : "POST",
    url : "ServerService",
    contentType : 'application/json',
    mimeType : 'application/json',
    data : msg
  });
}

function moreEPGInfo(subscriber, start, end, channelList) {
    var msg = "{'actionService': 'ACTION_GUIDE_LAZY_LOAD', 'subscriberName' : '" + subscriber + "', 'start' : '" + start + "', 'end' : '" + end + "', 'channelList' : '" + channelList + "'}";
    return $.ajax({
      async : true,
      type : "POST",
      url : "ServerService",
      contentType : 'application/json',
      mimeType : 'application/json',
      data : msg
    });    

}

function scheduleProgram(subscriber, userId, item, options, async) {
	 var recordingSetType = "programs";
	 var recordingSetId = "personal" 
	 if(!async){
	    async = true;
	  }
	  var msg = "{\"actionService\": \"SCHEDULE\", \"subscriberName\" : \"" + subscriber + "\", \"userId\" : \"" +  userId + "\", \"recordingSetType\" : \"" +  recordingSetType + "\", \"recordingSetId\" : \"" +  recordingSetId  + "\", \"options\" : " + JSON.stringify(options) + ", \"item\" : " + JSON.stringify(item) + "}";
	  return $.ajax({
	    async : async,
	    type : "POST",
	    url : "ServerService",
	    contentType : 'application/json',
	    mimeType : 'application/json',
	    data : msg
	  });
}

function scheduleSerieProgram(subscriber, userId, item, options, async) {
	  if(!async){
	    async = true;
	  }
	  var msg = "{\"actionService\": \"SCHEDULE SERIES\", \"subscriberName\" : \"" + subscriber + "\", \"userId\" : \"" + userId + "\", \"options\" : " + JSON.stringify(options) + ", \"item\" : " + JSON.stringify(item) + "}";
	  return $.ajax({
	    async : async,
	    type : "POST",
	    url : "ServerService",
	    contentType : 'application/json',
	    mimeType : 'application/json',
	    data : msg
	  });
	}

function getGmtUtcTime() {
  return new Date().toGMTString();
}


function getPlaySession(obj) {
  var msg = {};
  msg.actionService = "PLAYBACK";
  msg.subscriberName = obj.subscriberName;
  msg.recordingId = obj.recordingId;
  msg.recordingSetId = obj.recordingSetId;
  msg.userId = obj.userId;
  msg.type = obj.type;
  msg.payload = obj.payload;
  msg = JSON.stringify(msg);
  return $.ajax({
    async : true,
    type : "POST",
    url : "ServerService",
    contentType : 'application/json',
    mimeType : 'application/json',
    data : msg
  });
}

function renderConfigMenu(){
	addOptionConfigMenu();
	$('.config_menu').css({
	    top : properties.pointer_y - 80 + 'px',
	    left : properties.pointer_x + 10 + 'px'
	  }).show();
}

function renderPopoverDialog(){
	  var configMenuIcon = $('#subscriberIcon');
	  var signButton = $('#signButtonPopOver');
	  	  
	  configMenuIcon.popover({html : true, 
		  content: function(context){
			     return $('#popoverContent').html();}, title:  "Sign Out"
	  });
	  	  
	  configMenuIcon.on('hide.bs.popover', function () {
		  var button =  $('#signOutButton');
		  button.unbind();
		});
	  
	  configMenuIcon.on('shown.bs.popover', function () {
		  var popoverList = [];
		  popoverList.push($('#deviceIcon'));
		  popoverList.push($('#userIcon'));
		  closePopover(popoverList);
		  
		  var popoverTitles = $('.popover-title');
		  for(var i=0; i<popoverTitles.length; i++){
			  var element = $(popoverTitles[i]);
			  if(element.text() === "Sign Out"){
				  element.attr("id", "signOutButton");
				  element.addClass("signButton");
			  }
		  }
		  
		  var SignOutButton = $('#signOutButton');
		  SignOutButton.bind("click",function(){
			  removeSubscriberRemembered();
			  location.reload();
		  });
		  
	      updateProgressQuota();
          $('[data-toggle="tooltip"]').tooltip();
	  });
}


function renderDevicePopoverDialog(){
	  var configMenuIcon = $('#deviceIcon');
	  
	  configMenuIcon.popover({html : true, content: function(context){return $('#popoverDeviceContent').html();}, title:  "Devices"});
	  
	  configMenuIcon.on('hide.bs.popover', function () {
		  var unknownElement = $('#unknownDeviceItem');
		  unknownElement.unbind();
	  });
	  
	  configMenuIcon.on('shown.bs.popover', function () {	
		  var popoverList = [];
		  popoverList.push($('#subscriberIcon'));
		  popoverList.push($('#userIcon'));
		  closePopover(popoverList);
		  
		  var unknownElement = $('#unknownDeviceItem');
		  unknownElement.bind('click', function(){
			  var unknownElement = $(this);
			  var device = {};
			  device.id = unknownElement.text();
			  device.name = unknownElement.text();
			  $("#deviceNameTitle").html(device.name);
			  window.params.deviceSelected = device;
			  saveDevice();
			  $('#deviceIcon').popover('hide');
		  });
		  if(window.params.subscriber.devices){
			  addDeviceToList(window.params.subscriber.devices);  
		  }
      $('[data-toggle="tooltip"]').tooltip();
	  });
}


function closePopover(popoverList){
	popoverList.forEach(function(popoverItem) {
	   var popoverItemIsVisible = popoverItem.data('bs.popover').tip().hasClass('in');
	   if(popoverItemIsVisible){
		   popoverItem.popover('hide');
	   }
	});
}

function getUserList(){
	var userList = [];
	$.each(window.params.subscriber.users, function(index, value){
		var oldUser = {};
		oldUser.id = value.id;
		oldUser.name = value.name;
		userList.push(oldUser);
	});
	return userList;
}


function addNewUser(){
	var editableLabel = $('#labelNewUser');
	var newUserName = undefined;
	if(editableLabel && editableLabel.val().trim()!==""){
		  newUserName = editableLabel.val().trim();
		  editableLabel.val("new user");
	}
	var addLast = true;
	var userAction = "fa fa-times userItemDelete";
	if(newUserName && newUserName.trim() !== "new user"){
		var userList = getUserList();
		var newUserObj = {};
		newUserObj.id = newUserName;
		newUserObj.name = newUserName;
		userList.push(newUserObj);
		// Test Monitor
		var msgObj = {};
		msgObj.className = "dataMonitorMsg";
		msgObj.msg = "Creating new user: " + newUserObj.id + ", in subscriber: " + window.params.subscriberName;
		reportActivity(msgObj);
		// Test Monitor------------------------------
		var deferred = sendNewUser(userList, true);
		$.when(deferred).done(function(data) {
		  if((data && data.ERROR)){
		      informErrorActivity(data);
		  }else{
			 createUserItem(newUserName, userAction, addLast);	
		     informSuccessActivity(data);
		   }
		});
	}else{
		editableLabel.val("new user");
	}
}

function editNewUser(evt){
	var editableLabel = $('#labelNewUser');
	editableLabel.attr('class','userItemList fixedUserItem');	
	addNewUser();
	editableLabel.attr('readonly','readonly');
}

function sendNewUser(newUser, asyncCall) {
	  var requestInfo = {};
	  requestInfo.actionService = "CREATE_USER",
	  requestInfo.subscriberName = window.params.subscriberName;
	  requestInfo.payload = newUser;
	  var msg = JSON.stringify(requestInfo);
	  return $.ajax({
	    async : asyncCall,
	    type : "POST",
	    url : "ServerService",
	    contentType : 'application/json',
	    mimeType : 'application/json',
	    data : msg
	  });
}

function getSubscriberUsers(asyncCall) {
	  var requestInfo = {};
	  requestInfo.actionService = "GET_USERS",
	  requestInfo.subscriberName = window.params.subscriberName;
	  var msg = JSON.stringify(requestInfo);
	  return $.ajax({
	    async : asyncCall,
	    type : "POST",
	    url : "ServerService",
	    contentType : 'application/json',
	    mimeType : 'application/json',
	    data : msg
	  });
}

function sendDeleteUser(targetUser, asyncCall) {
	  var requestInfo = {};
	  requestInfo.actionService = "DELETE_USER",
	  requestInfo.subscriberName = window.params.subscriberName;
	  requestInfo.userId = targetUser;
	  var msg = JSON.stringify(requestInfo);
	  return $.ajax({
	    async : asyncCall,
	    type : "POST",
	    url : "ServerService",
	    contentType : 'application/json',
	    mimeType : 'application/json',
	    data : msg
	  });
}

function renderUserPopoverDialog(){
	  var configMenuIcon = $('#userIcon');
	  var editableLabel = $('#labelNewUser');
	  configMenuIcon.popover({html : true, content: function(context){return $('#popoverUserContent').html();}, title:  "Users"});
	  
	  configMenuIcon.on('hide.bs.popover', function () {
		  var editableLabel = $('#labelNewUser');
		  editableLabel.unbind();
		});
	  
	  
	  configMenuIcon.on('shown.bs.popover', function () {	
		  var popoverList = [];
		  popoverList.push($('#subscriberIcon'));
		  popoverList.push($('#deviceIcon'));
		  closePopover(popoverList);
		  
		  var editableLabel = $('#labelNewUser');
		  editableLabel.bind('click', function(){
			  editableLabel.removeAttr('readonly');
			  editableLabel.val("");
			  editableLabel.attr('class','userItemListEditable fixedUserItem');
			  editableLabel.focus();
		  });
		  
		  
	  editableLabel.focusout(function(e){
		  editNewUser(e);
	  });
	  
	  editableLabel.keyup(function(e){
		  if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
			editableLabel.focusout();
		  }
	  });
	      window.params.subscriber.users = refreshUserList();
		  addUserToList(window.params.subscriber.users);
        $('[data-toggle="tooltip"]').tooltip();
	  });
}

function refreshUserList(){
	var latestList = [];
	var msgObj = {};
	msgObj.className = "dataMonitorMsg";
	msgObj.msg = "refreshing  user List on subscriber: " + window.params.subscriberName;
	reportActivity(msgObj);
	// Test Monitor------------------------------
	var asyncCall = false;
	var deferred = getSubscriberUsers(false);
	$.when(deferred).done(function(data) {
	  if((data && data.ERROR)){
	      informErrorActivity(data);
	  }else{
	     latestList = data.users;
	     informSuccessActivity(data);
	   }
	});
	return latestList;
}

function addDeviceToList(devices){
	var userList = $('#availableDeviceList');
	deviceAction = "fa fa-circle userItemLock";
	devices.forEach(function(device) {
		createDeviceItem(device.name, deviceAction);	
	});
}

function addUserToList(users){
	var userList = $('#availableUserList');
	var userAction = undefined;
	if(users.length > 0){
		users.forEach(function(user) {
		   userAction = "fa fa-times userItemDelete";
		   createUserItem(user.name, userAction);
		});
	}else{
		userAction = "fa fa-lock userItemLock";
		createUserItem(user.name, userAction);
	}	
}

function createDeviceItem(name,deviceAction){
	var deviceList = $('#availableDeviceList');
	var idElement = 'deviceElement' + deviceList.children().length;
	var divRow = $('<div/>');
	divRow.attr("id", idElement);
	divRow.attr("class", "row");
	divRow.appendTo(deviceList);
	
	var divCol = $('<div/>');
	divCol.attr("class", "col-md-3");
	divCol.appendTo(divRow);
	var icon = $('<i/>');
	icon.attr("class", "fa fa-television userItem");
	icon.appendTo(divCol);
	
	var divCol2 = $('<div/>');
	divCol2.attr("class", "col-md-13");
	divCol2.appendTo(divRow);
	var span = $('<span/>');
	span.attr("class", "userItemList");
	span.html(name)
	
	span.bind('click', function(){
		window.params.deviceSelected = _.findWhere(window.params.subscriber.devices, {name: span.text()});
		saveDevice();
		$(deviceNameTitle).html(window.params.deviceSelected.name);
		$('#deviceIcon').popover('hide');
	});

	span.appendTo(divCol2);
	
	var divCol3 = $('<div/>');
	divCol3.attr("class", "col-md-2");
	divCol3.appendTo(divRow);
	var icon2 = $('<i/>');
	icon2.attr("class", deviceAction);
	icon2.appendTo(divCol3);
	
}


function createUserItem(name,userAction, addLast){
	var userList = $('#availableUserList');
	var idElement = 'userElement' + userList.children().length;
	var divRow = $('<div/>');
	divRow.attr("id", idElement);
	divRow.attr("class", "row");
	
	if(addLast){
	  divRow.insertBefore('#newUser');
	}else{
	  divRow.prependTo(userList);	
	}
	
	var divCol = $('<div/>');
	divCol.attr("class", "col-md-3");
	divCol.appendTo(divRow);
	var icon = $('<i/>');
	icon.attr("class", "fa fa-user userItem");
	icon.appendTo(divCol);
	
	var divCol2 = $('<div/>');
	divCol2.attr("class", "col-md-13");
	divCol2.appendTo(divRow);
	var span = $('<span/>');
	span.attr("class", "userItemList");
	span.html(name)
	
	span.bind('click', function(){
		window.params.userSelected = _.findWhere(window.params.subscriber.users, {name: span.text()});
		saveUser();
		$(userNameTitle).html(window.params.userSelected.name);
		$('#userIcon').popover('hide');
	});

	span.appendTo(divCol2);
	
	var divCol3 = $('<div/>');
	divCol3.attr("class", "col-md-2");
	divCol3.appendTo(divRow);
	var icon2 = $('<i/>');
	icon2.attr("class", userAction);
	
	if(userAction === "fa fa-times userItemDelete"){
		icon2.bind('click', function(){
			var userSelected = userList.children('#' + idElement).find('span').html();
			// Test Monitor
			var msgObj = {};
			msgObj.className = "dataMonitorMsg";
			msgObj.msg = "Deleting  user: " + userSelected + ", in subscriber: " + window.params.subscriberName;
			reportActivity(msgObj);
			// Test Monitor------------------------------
			var deferred = sendDeleteUser(userSelected, true);
			$.when(deferred).done(function(data) {
			  if((data && data.ERROR)){
			      informErrorActivity(data);
			  }else{
				 userList.children('#' + idElement).remove();
			     informSuccessActivity(data);
			   }
			}); 
		});
	}
	
	icon2.appendTo(divCol3);
	
}

function clearPrevousData(){
	window.ndvrItems.allItems = [];
	window.catchupChannels = [];
}

function reSignSubscriber(newSubscriber){
	if(window.params.subscriberName != newSubscriber){
		window.params.subscriber = window.params.newSubscriber;
		window.params.subscriberName = window.params.newSubscriberName;
		$('#userNameTitle').html(window.params.subscriberName);
		window.params.recordingConfig.RecordingsSchedules.subscriber = window.params.subscriberName; 
		saveSubscriberLogged();
		clearPrevousData();
		reloadGuide(function(){
		        addCatchupPrograms();
		        loadItemsNdvr(true, updateGuideProgramStatus.bind(this));
		        window.params.newSubscriber = undefined;
		        window.params.newSubscriberName = undefined;
		});	
	}
}

function showAlert(type, message){
 var headerPage = $("#AlertContainer");
 var alertMessage = $('<div/>');
 alertMessage.attr('role', 'alert');
 var strongMessage = undefined;
 switch (type) {
 	case CONSTANTS.ALERT_INFO:
 		strongMessage = '<strong>Information!</strong> ';
	break;
 	case CONSTANTS.ALERT_SUCCESS:
 		strongMessage = '<strong>Success!</strong> ';
	break;
 	case CONSTANTS.ALERT_WARNING:
 		strongMessage = '<strong>Warning!</strong> ';
	break;
 	case CONSTANTS.ALERT_DANGER:
 		strongMessage = '<strong>Error!</strong> ';
 	break;
 	
 	default:
	break;
 }
 alertMessage.addClass(type);
 alertMessage.html(strongMessage + message);
 alertMessage.appendTo(headerPage);
 alertMessage.fadeTo(3000, 500).slideUp(800, function(){
	 alertMessage.alert('close');
 });
}

function saveFavoriteChannels(subscriberName, favorites){
	var subFavCh = {};
	subFavCh.subcriber = subscriberName;
	subFavCh.favorites = favorites;
	saveSubscriberFavChannel(subFavCh);
}

function playAfterPauseLive(){
	   window.params.player.off("play", playAfterPauseLive);
	   var program = getAiredProgrambyChannel(window.params.tunnedChannel);
	   if(program && program.programType === CONSTANTS.CATCHUP_TV_TYPE){
		 preview(program, CONSTANTS.FEATURE_PAUSE_LIVE_TV);
	   }
}

function getLiveProgramOffset(startProgram){
  var dateStart = new Date(startProgram);
  var now = new Date();
  var diff = Math.floor((now - dateStart)/1000);
  return diff;
}

function getAiredProgrambyChannel(stationId){
	var program =	window.timeline.itemSet.getItems().get({filter: 
		  	  function(item){
		            	var now = new Date();
		            	var start = new Date(item.start);
		            	var end = new Date(item.end);
		            	return (item.group === stationId && (start <= now && now <= end));
			  }});
	return (program.length>0)?program[0]:undefined;
}

function serviceHasFeature(service){
	var packageServicesInfo = window.params.subscriber.servicePackageInfo;
	var features = packageServicesInfo.features;
	return (features && features.length >0 && _.contains(features, service));
}

function setTimeElapsedActiveSession(sessionData){
  if(window.playingLive){
	  window.activePlaybackSession.timeElapsed = sessionData.payload.offset;	  
   }else{
      window.activePlaybackSession.timeElapsed = 0;
   }
}

function setOffsetByFeature(sessionFeature, sessionData, program){
   sessionData.payload.feature = sessionFeature;
   if(sessionFeature === CONSTANTS.FEATURE_PAUSE_LIVE_TV){
	   sessionData.payload.offset = getLiveProgramOffset(program.start);
   }else{
	  sessionData.payload.offset = 0;
   }
}

function validateMenuOptionOnlyFor(program, onlyFor){
	var isValid = true;
	onlyFor.forEach(function(restrict) {
		var result = false;
		if(restrict === CONSTANTS.MENU_OPTION_ONLY_FOR_NOT_PLAYING){
			result = !validateIsPlaying(program);
		}else if(restrict === CONSTANTS.MENU_OPTION_ONLY_FOR_SERIES){
			result = (program.metadata.altSeries && (program.metadata.altSeries.length>0 && program.metadata.altSeries != "null"))
		}
		isValid = isValid && result;
	});	
	return isValid;
}

function showSubscriberSelected(){
	$('#subscriberNameTitle').html(window.params.subscriberName);
}

function showUserSelected(){
	var rememberedUser = window.params.userSelected;
	var userFound = undefined;
	if(rememberedUser){
		userFound = _.findWhere(window.params.subscriber.users, {id: rememberedUser.id});
	}
	if(!userFound){
		if(window.params.subscriber.users.length > 0 ){
			userFound = window.params.subscriber.users[0];
		}else{
			showAlert(CONSTANTS.ALERT_DANGER, "Subscriber doesn't have a valid user");
			setTimeout(function(){
			    removeSubscriberRemembered();
			    location.reload(); 
				}, 2000);
		}
	}
	window.params.userSelected = userFound;
	$('#userNameTitle').html(userFound.name);
}

function showDeviceSelected(){
	var rememberedDevice = getLocalStorageDevice();
	var deviceFound = undefined;
	if(rememberedDevice){
		deviceFound = _.findWhere(window.params.subscriber.devices, {id: rememberedDevice.id});
	}
	if(!deviceFound){
		if(window.params.subscriber.device && window.params.subscriber.devices.length > 0 ){
			deviceFound = window.params.subscriber.devices[0];
			window.params.deviceSelected = deviceFound;
		}else{
			deviceFound = {};
			deviceFound.id = "Unknown";
			deviceFound.name = "Unknown";
		}
	}
	window.params.deviceSelected = deviceFound;
	$('#deviceNameTitle').html(window.params.deviceSelected.name);
}

function getProgramRTV(){
    
    var FECHA = '2016-03-08';
    var HORA = '18:00';
    var idCategoria =  '4';
    var IDALINEACION = '2680';
    $.ajax({
        async: true,
        type: "POST",
        url: "https://www.reportv.com.ar/"+"finder/grid",
        data: { idAlineacion : IDALINEACION, fecha: FECHA, hora: HORA, idCategoria: idCategoria},
        success: (function(data){
                    console.log(data);
                 })
    });
}
