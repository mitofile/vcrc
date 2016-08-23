var CUIS = function(){
		this.series = undefined;
		this.latest = undefined;
		this.scheduled = undefined;
		this.deleted = undefined;

		//Private method
		var send = function sendRequest(asyncCall, servicePath, payload, methodCall, requestTitle){
			// Test Monitor
			var msgObj = {};
			msgObj.className = "dataMonitorMsg";
			msgObj.msg = requestTitle;
			reportActivity(msgObj);
			// Test Monitor------------------------------
			   return $.ajax({
					async : asyncCall,
					type : methodCall,
					url : servicePath,
					contentType : 'application/json',
					mimeType : 'application/json',
					data : payload
				});
		};
		
		var prepareResponse = function(response){
			var purgedResponse = {};
			purgedResponse.series = {};
			purgedResponse.series = _.where(response, {type : "series"});
			purgedResponse.programs = _.where(response, {type : "programs"});
			return purgedResponse;
		};
		
		this.getRecordings = function(subscriber, user){
			var purgedResponse = {};
			var url = window.params.serviceConfig.cuis.endpoint + window.params.serviceConfig.cuis.allRecordings;
			url = url.replace("{subscriberId}", subscriber);
			url = url.replace("{userId}", user);
			var payload = {};
			var methodCall = "GET";
			var asyncCall = true;
			var requestTitle = "Getting Recordings of Subscriber: " + window.params.subscriber.name + ", from CUIS";
			var deferred = send(asyncCall, url, payload, methodCall, requestTitle);
			$.when(deferred, url, payload, methodCall).done(function(data) {
				data.monitor = {};
				data.monitor.payload = payload;
				data.monitor.method = methodCall;
				data.monitor.ur = url;
				if (data.info && data.info.ERROR) {
					informErrorActivity(data);
				} else {
					informSuccessActivity(data);
					purgedResponse = prepareResponse(data[0].Entities);
					//var programs = filterProgramsByStatus('COMPLETED', data.info.entities);
					//programs = addFormatedDate(programs);
					
					//recordingSet.programs = programs;
				}
			});
			return purgedResponse;
		};


		this.getItem = function(itemId){

		};

};	


