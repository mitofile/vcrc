function parseRecommendedResponse( response) {
	this.recommmendedRecords = [];
	var that = this;
	var recommendedArray = response.programs;
	var recommendedMockArray = response.mockArray.programs;
	var maxItems = response.maxQtyRecommendedPoster;
	this.recommmendedRecords  = addItemsToArrayAndReplace(this.recommmendedRecords,recommendedArray,recommendedMockArray);
	this.recommmendedRecords  = addItemsToArray(this.recommmendedRecords,recommendedMockArray);
	return this.recommmendedRecords;
}

function addItemsToArrayAndReplace(array, itemsRecommended, itemsMock){
	$.each(itemsRecommended, function(key, value) {
		var objR = createRecommendedItem(value);

		$.ajax({url:objR.poster,
			type:'HEAD', 
			async:false,
			success:function(){
				array.push(objR);
			},
			error:function(){
				console.log("Error request on '" + objR.poster + "'");
		}});
	});
	return array;
}
function addItemsToArray(array, recommendedMockArray) {
	$.each(recommendedMockArray, function(key, value) {
		if (key >= array.length) {
			var found = _.findWhere(array, {
				id : value.id
			});
			if (!found) {
				var objR = createRecommendedItem(value);
				array.push(objR);
			}
		}

	});
	return array;
}

function createRecommendedItem(value){
	var id = value.id;
	var contentType = value.type;
	var metadata = value.metadata;
	var rottenTomatoesScore = value.scores==undefined?'unrated':value.scores.tmeter + "%";
	var programId = value.id;
	var poster = value.poster == undefined ? "./posterImage/" + programId + ".jpg" : value.poster;
	var type = "recommended";
	return new RecommendedRecord(id, contentType, rottenTomatoesScore, programId, poster, metadata, type);
}


function getPreview(item){
	var i = 0;
	var url240p = undefined;
	var url480p = undefined;
	var url720p = undefined;
	var qualityRequired = false;
	for(i=0;i<item.metadata.trailer.qualities.length;i++){
		var quality = item.metadata.trailer.qualities[i].quality;
		if(quality == "480p"){
			url480p = item.metadata.trailer.qualities[i].videoURL;
			qualityRequired = true;
		}
		if(quality == "240p"){
			url240p = item.metadata.trailer.qualities[i].videoURL;
		}
		if(quality == "720p"){
			url720p = item.metadata.trailer.qualities[i].videoURL;
		}
	}
	var urlTrailer = undefined;
	if(qualityRequired){
		urlTrailer = url480p;
	}else{
		urlTrailer = url240p?url240p:url720p;
	}
	var msg = "{'actionService': 'PREVIEW', 'urlTrailer' : '" + urlTrailer + "', 'localTrailer' : '" + item.metadata.localTrailer + "'}";
	$.ajax({
		type: "POST",
		url: "ServerServiceVOD",
		contentType: 'application/json',
		mimeType: 'application/json',
		data: msg,
		async: false,
		success : function(data){
			var trailer = null;
			if(data && data.preview){
				trailer = data.preview;
			}
			assetInfo.playTrailer = trailer.videoPlayerObject.video.url;
		}
	});
}

function moreLikeThis(item, callback){
	var result = undefined; 
	var msg = "{'actionService': 'MORELIKETHIS', 'channel_map_id' : '" + item.channel_map_id + "', 'correlation_id' : '" + item.correlation_id + "'}";
	$.ajax({
		type: "POST",
		url: "ServerServiceVOD",
		contentType: 'application/json',
		mimeType: 'application/json',
		data: msg,
		async: true,
		success : function(data){
			if(data && data.moreLikeThis){
				result = data.moreLikeThis;
			}
		//	callback(result);
		},
		error: function(e){
			console.log('error on request moreLikeThis');
		},
		complete: function(data, e){
			callback(result);
		}
	});
}

function getDuration(runtime){
	var result = null;
	var strDuration = runtime[0].split("min")[0].trim();
	result = parseInt(strDuration);
	var duration = new Date(0,0,0);
	duration.setMinutes(+result);
	var hours = duration.getHours() < 10 ? "0" + duration.getHours() : duration.getHours();
	var minutes = duration.getMinutes() < 10 ? "0" + duration.getMinutes(): duration.getMinutes();
	var seconds = duration.getSeconds() < 10 ? "0" + duration.getSeconds() : duration.getSeconds();
	return  hours + ":" + minutes + ":" + seconds ;
}

function getNames(nameArray){
	var result = undefined;
	if(nameArray){
	  var i = 0;
	  var limit = nameArray.length>3?3:nameArray.length;
	  for(i = 0;i<limit;i++){
		  result = result?result + "; " + nameArray[i].name : nameArray[i].name;
	  }
	}
	return result;
}
