package com.demo.service;

import org.apache.log4j.Logger;
import org.json.*;

/**
 * @author Iacono Diego
 *
 */
public class ServiceStop extends Service{
	static final Logger LOGGER = Logger.getLogger(ServiceDelete.class);
		

	public ServiceStop(JSONObject clientMessage){
		this.clientMessage = clientMessage;
	}

	/**
	 * @return
	 */
	public JSONObject stopRecord() {
		LOGGER.info("Stopping an NDVR Item");
		return changeRecordingStatusTo(STATUS_COMPLETED);
	}
	
	/**
	 * The subscriber does not want any more episodes from the series schedule to be recorded.
	 * All scheduled episodes are canceled. 
	 * Recordings being captured are completed until the current progress. Completed recordings remain as they are.
	 * @return JSONObject Response
	 */
	public JSONObject cancelSeries() {
		LOGGER.info("Cancel a RecordingSet series on NDVR");
		JSONObject jsonResponse = null;
		try {
			String recordingSetId = clientMessage.getString("recordingSetId");
			String subscriber = clientMessage.getString("subscriberName");
			String userId = clientMessage.getString("userId");
			jsonResponse = changeSeriesStateOnDVR(recordingSetId, subscriber, userId, RS_STATUS_INACTIVE);
		} catch (JSONException e) {
			LOGGER.error("ERROR Cancel RecordingSet series. " + e.getMessage());
		}
		return jsonResponse;
	}
}
