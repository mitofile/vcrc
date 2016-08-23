window.params.onKeyup = function(inEvent) {

  switch (inEvent.which) {
    case MWU.REMOTEKEY.UP:
      window.params.upHandler();
      break;

    case MWU.REMOTEKEY.DOWN:
      window.params.downHandler();
      break;

    case MWU.REMOTEKEY.LEFT:
      window.params.leftHandler();
      break;

    case MWU.REMOTEKEY.BACK:
      window.params.leftHandler();
      break;

    case MWU.REMOTEKEY.RIGHT:
      window.params.rightHandler();
      break;

    case MWU.REMOTEKEY.OK:
      window.params.enterHandler();
      break;

    case MWU.REMOTEKEY.ZERO:
    case MWU.REMOTEKEY.ONE:
    case MWU.REMOTEKEY.TWO:
    case MWU.REMOTEKEY.THREE:
    case MWU.REMOTEKEY.FOUR:
    case MWU.REMOTEKEY.FIVE:
    case MWU.REMOTEKEY.SIX:
    case MWU.REMOTEKEY.SEVEN:
    case MWU.REMOTEKEY.EIGHT:
    case MWU.REMOTEKEY.NINE:
      var val = String.fromCharCode(inEvent.which);
      if (inEvent.which >= 48 && inEvent.which <= 57) {
        window.params.pressedKey += val;
        $('#channelEntry').show();
        $('#channelPointed').html(window.params.pressedKey)
        clearTimeout(window.params.changeChnTimeout);
        window.params.changeChnTimeout = setTimeout(function() {
          var num = parseInt(window.params.pressedKey);
          var value = num / 10;
          var integ = Math.floor(value);
          var dec = value - integ;
          var result=Math.round(dec*10)/10
          var decInteger =  Math.floor(result * 10);
          var number;
          if (integ > 0) {
            number = integ * 10;
            if(window.device.height_fact == 2 && decInteger > 5){
              number +=5;
            }
            if (dec == 0) {
              number = integ * 10 - configGuide.channels_count[window.device.name];
            }
          } else {
            number = 0;
          }
          var foundChannel = _.findWhere(window.params.channels.channels, { station_channel_id : window.params.pressedKey});
          if(foundChannel){
            renderNextGroups(number, 1, function(){
              focusOnChannel(window.params.pressedKey);
              addCatchupPrograms();
              updateGuideProgramStatus();
              window.params.pressedKey = "";
              $('#channelEntry').hide();
            });
          } else{
          $('#channelEntry').hide();	  
          window.params.pressedKey = "";
          }
        }, 800);
      }
      break;

    default:
      inEvent.preventDefault();
      break;
  }
};

window.params.upHandler = function(timeline) {
  moveUpDown(-1);
};
window.params.downHandler = function(timeline) {
  moveUpDown(1);

};
window.params.leftHandler = function(timeline) {
  moveLeftRigth(-1);
};
window.params.rightHandler = function(timeline) {
  moveLeftRigth(1);
};
window.params.enterHandler = function(timeline) {

};

function moveUpDown(direction) {

  var timeline = window.timeline;
  var focused_item = timeline.itemSet.items[timeline.itemSet.getSelection()];
  var group = focused_item.parent;
  var indexGroup = parseInt(group.groupId);
  
  var index = $.inArray(indexGroup + "",window.timeline.groupsData.getIds());
  //Change this logic for more than 10 channels Filtered!!
  var enabled = $('#favoriteIcon').hasClass('filterFavoriteEnabled');
  if(enabled){
	  var limit =(direction>0)? window.timeline.groupsData.getIds().length - 1:0;
	  if(limit===index){
		  return;  
	  }
  }
  var newIndexGroup = window.timeline.groupsData.getIds()[index+direction]
  var nextGroup = timeline.itemSet.groups[newIndexGroup];
  if (!nextGroup) {
    if (getChannelIndex(indexGroup) > 0 ) {
      renderNextGroups(indexGroup, direction, function() {
        loadingGrid(false);
        if (direction > 0) {
          var nextProgram = takeFocusProgram(focused_item, timeline.itemSet.groups[timeline.groupsData.get()[0].id]);
          loadProgramInfo(nextProgram.data);
          timeline.setSelection(nextProgram.id);
        } else {
          var nextProgram = takeFocusProgram(focused_item, timeline.itemSet.groups[timeline.itemSet.groupsData.get()[timeline.itemSet.groupsData.get().length - 1].id]);
          loadProgramInfo(nextProgram.data);
          timeline.setSelection(nextProgram.id);
        }
      });
    }
  } else {
    var nextProgram = takeFocusProgram(focused_item, nextGroup);
    loadProgramInfo(nextProgram.data);
    timeline.setSelection(nextProgram.id);
  }
};

function takeFocusProgram(program, nextGroup) {
  var nextProgram = undefined;
  var currentStart = parseInt(program.data.metadata.air_date);
  var currentEnd = parseInt(program.data.metadata.end_date);
  $.each(nextGroup.visibleItems, function(i, item) {
    if (window.params.columnFocusDate.getTime() >= parseInt(item.data.metadata.air_date) * 1000 && window.params.columnFocusDate.getTime() < parseInt(item.data.metadata.end_date) * 1000) {
      nextProgram = item;
      return false;
    }
  });
  return nextProgram;

}

function moveLeftRigth(direction) {
  var timeline = window.timeline;
  var focused_item = timeline.itemSet.items[timeline.itemSet.getSelection()];
  if(!focused_item){
	  return;
  }
  var group = focused_item.parent;

  // var nextItem = group.items[focused_item.id + direction];
  var nextItem = getNextPreviousProgram(focused_item, group, direction);
  var now = new Date(timeline.getCurrentTime());
  var nextEnd;
  if (nextItem) {
    nextEnd = new Date(nextItem.data.end);
  }
  if (nextEnd && now < nextEnd) {
    var window_start = new Date(timeline.getWindow().start);
    var window_end = new Date(timeline.getWindow().end);
    if (parseInt(nextItem.data.metadata.air_date) * 1000 >= window_end.getTime()) {
      timeline.moveTo(parseInt(nextItem.data.metadata.air_date) * 1000, {
        animate : 250
      });
    }
    if (parseInt(nextItem.data.metadata.air_date) * 1000 <= window_start.getTime()) {
      timeline.moveTo(parseInt(nextItem.data.metadata.air_date) * 1000, {
        animate : 250
      });
    }
    window.params.columnFocusDate = new Date(nextItem.data.start);
    loadProgramInfo(nextItem.data);
    timeline.setSelection(nextItem.id);
  }
};

function getNextPreviousProgram(current, group, direction) {
  var itemsGroup = group.orderedItems.byStart;
  // var itemsGroupEnd = group.orderedItems.byEnd;
  var index = itemsGroup.indexOf(current);
  var nextItem;
  for (var int = index + direction; int < itemsGroup.length && index + direction >= 0;) {
    var currentStart = new Date(current.data.start);
    var currentEnd = new Date(current.data.end);
    var itemStart = new Date(itemsGroup[int].data.start);
    var itemEnd = new Date(itemsGroup[int].data.end);
    if (direction > 0) {
      if (currentEnd.getTime() == itemStart.getTime()) {
        nextItem = itemsGroup[int];
        break;
      }
      int++;
    } else {
      if (currentStart.getTime() == itemEnd.getTime()) {
        nextItem = itemsGroup[int];
        timeline.emit('rangechanged', {
          end : itemStart
        });
        break;
      }
      int--;

    }

  }
  return nextItem;

}

function checkLastGroup(index) {
  if (index == groups.length - 2) {
    return true;
  }
  return false;
}

function getChannelIndex (station_id) {
    var array = window.params.channels.channels;
	var index = 0, len = array.length;
    for (; index < len; index++) {
      if (array[index].station_id==station_id) {
        return index;
      }
    }
    return index;
}

function unFilterChannels(){
	loadingGrid(true);
	var groups = [];
	var dataItems = [];
	timeline.itemSet.groupsData.clear();
	timeline.itemSet.itemsData.clear();
	createGroupsOfChannels(groups, window.params.channels.channels);
	timeline.groupsData.add(groups);
    createPrograms(dataItems, window.params.programs.epgGuide);
    timeline.setItems(dataItems);
    //decorate catchup again
    window.catchupChannels = [];
    addCatchupPrograms();
    
    loadingGrid(false);
}

function parseChannels(){
	var channels = window.params.subscriber.channels[0].channels;
	var parsedChannels = [];
	channels.forEach(function(channel) {
		var objChannel = {};
		objChannel.station_channel_id = channel.id;
		objChannel.call_sign = channel.name;
		objChannel.station_id = channel.stationId;
		objChannel.uri = channel.uri;
		parsedChannels.push(objChannel);
	});
	return parsedChannels;
}


function reloadGuide(callback) {
	if(window.params.subscriber 
		&& isSubscriberChannelValid(window.params.subscriber)){
		  loadingGrid(true);
		  var timeline = window.timeline;
		  var groups = [];

		  var channels = parseChannels();
		  
          var subfavObj = getSubscriberFavChannel(window.params.subscriberName);
          window.favorites = subfavObj.favorites;
          
		  createGroupsOfChannels(groups, channels);

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
		    loadingGrid(false);
		  }).then(function(){
			  if(callback){
					callback();
				}  
		  });	
	}
}


function renderNextGroups(index, direction, callback) {
  var index = getChannelIndex(index);
  if((index+direction)==window.params.channels.channels.length){
	  return;
  }
  
  loadingGrid(true);
  window.catchupChannels = [];  //clean list for refresh catchup icons
  window.indexPrograms = 0;
  var min_index_channel, max_index_channel, countItem = configGuide.channels_count[window.device.name];
  if (direction > 0) {
    index_channel = index;
    max_index_channel = index + direction * countItem;
  } else {
    index_channel = (index + direction * countItem) - 1;
    max_index_channel = index - 1;
  }
  var timeline = window.timeline;
  var groups = [];
  window.indexChannels = index_channel;
  //var nextChannels = window.params.channels.channels.slice(index_channel, max_index_channel);
  var nextChannels = [];
  var channel;
  for(var i=1; i<countItem+1; i++){
	  channel = window.params.channels.channels[index_channel+i];
	  if(channel){
		  nextChannels.push(channel);
	  }
  }
  
  createGroupsOfChannels(groups, nextChannels);

  timeline.itemSet.groupsData.clear();
  timeline.itemSet.itemsData.clear();
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
    window.params.programs = program;
    window.params.start = program.start;
    window.params.end = program.end;
    createPrograms(dataItems, program.epgGuide);
    timeline.setItems(dataItems);
    loadingGrid(false);
  }).then(callback);

}

function getCurrentProgram(channel){
  var first;
  $.each(channel.visibleItems, function(i, item) {
    if(isLiveTv(item)){
      first = item;
      return false;
    }
  });
  return first;
}

function focusOnChannel(channelId) {
  var first;
  var channel = timeline.itemSet.groups[channelId];
  if(channel)
    first = getCurrentProgram(channel);
  window.params.columnFocusDate = new Date(first.data.start);
  loadProgramInfo(first.data);
  window.timeline.setSelection(first.id);
  
}
