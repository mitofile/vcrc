package com.demo.service;

import org.apache.log4j.Logger;
import org.json.*;

/**
 * @author Iacono Diego
 *
 */
public class ServiceDelete extends Service{
	static final Logger LOGGER = Logger.getLogger(ServiceDelete.class);
	
	

	public ServiceDelete(JSONObject clientMessage){
		this.clientMessage = clientMessage;
	}
	
	public JSONObject deleteRecord() {
		LOGGER.info("Deleting a NDVR Item");
		return changeRecordingStatusTo(STATUS_DELETED);
	}
	
	public JSONObject restoreRecord() {
		LOGGER.info("Restoring a NDVR Item");
		return changeRecordingStatusTo(STATUS_COMPLETED);
	}
	
	/**
	 * The subscriber removes all recorded episodes from a series recording.
	 * The deleted episodes could be undeleted individually later.
	 * @return JSONObject response
	 */
	public JSONObject deleteSeries(){
		LOGGER.info("Deleting a Series on NDVR");
		JSONObject jsonResponse = null;
		try {
			String recordingSetId = clientMessage.getString("recordingSetId");
			String subscriber = clientMessage.getString("subscriberName");
			String userId = clientMessage.getString("userId");
			jsonResponse = changeSeriesStateOnDVR(recordingSetId, subscriber, userId, RS_STATUS_DELETED);	
		} catch (JSONException e) {
			LOGGER.error("ERROR Deleting Series Recording Set . " + e.getMessage());
		}

		return jsonResponse;
	}
	
}
