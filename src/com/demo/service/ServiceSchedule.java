package com.demo.service;

import org.apache.log4j.Logger;
import org.json.*;

import com.demo.util.*;

/**
 * @author diacono
 *
 */
public class ServiceSchedule extends Service {
	static final Logger LOGGER = Logger.getLogger(ServiceSchedule.class);
	
	public ServiceSchedule(JSONObject clientMessage){
		this.clientMessage = clientMessage;
	}
	
	public JSONObject sendKeepForEver(){
		JSONObject jsonResponse = new JSONObject();
		try {
			  markAsKeepForEver();
		} catch (JSONException e) {
			LOGGER.error("ERROR Scheduling program. " + e.getMessage());
		}
		return jsonResponse;
	}
	
	public JSONObject scheduleProgram() {
		JSONObject jsonResponse = new JSONObject();
		try {
			   LOGGER.info("Scheduling a program");
				jsonResponse = scheduleOnNDVR();
		} catch (JSONException e) {
			LOGGER.error("ERROR Scheduling program. " + e.getMessage());
		}

		return jsonResponse;
	}
	
	public JSONObject changeRecordingOptions() {
		JSONObject jsonResponse = new JSONObject();
		try {
			LOGGER.info("Modifying recording options");
			jsonResponse = changeRecOptionsOnNDVR();			
		} catch (JSONException e) {
			LOGGER.error("ERROR modifying recording options. " + e.getMessage());
		}
		return jsonResponse;
	}
	
	public JSONObject changeSeriesOptions() {
		JSONObject jsonResponse = new JSONObject();
		try {
			LOGGER.info("Modifying series options");
			jsonResponse = changeSeriesOptionsOnNDVR();			
		} catch (JSONException e) {
			LOGGER.error("ERROR modifying series options. " + e.getMessage());
		}
		return jsonResponse;
	}

	public JSONObject scheduleSeries() {
		JSONObject jsonResponse = new JSONObject();
		try {
			   LOGGER.info("Scheduling a Serie");
			   jsonResponse = scheduleSerieOnNDVR(clientMessage);
		} catch (JSONException e) {
			LOGGER.error("ERROR Scheduling Serie. " + e.getMessage());
		}

		return jsonResponse;
	}
	
	private JSONObject scheduleSerieOnNDVR(JSONObject scheduleItem) throws JSONException{
		JSONObject jsonResponse = null;
		String subscriber = scheduleItem.getString("subscriberName");
		String userId = scheduleItem.getString("userId");
		String url = getBaseCSUrl() + config.getNDVRScheduleSeries();
		JSONObject options = clientMessage.getJSONObject("options");
		float end = options.getInt("endOffset");
		options.put("endOffset", String.valueOf(end));
		String start = options.optString("startOffset");
		if(start!=null && start.length()>0){
			options.put("startOffset", start);
		}
		url = url.replace("{valueSubscriber}", subscriber);
		url = url.replace("{userId}", userId);
		String serieId = scheduleItem.getJSONObject("item").getJSONObject("metadata").getString("altSeries");
		String channelId = scheduleItem.getJSONObject("item").getJSONObject("metadata").getString("stationId");
		JSONObject payLoad = new JSONObject();
		payLoad.put("seriesId", serieId);
		payLoad.put("channelId", channelId);
		payLoad.put("options", options);
		JSONObject headers = new JSONObject();
		headers.put(RestClient.QUOTA_HEADER, true);
		try {
			jsonResponse = sendRequest(url, RestClient.METHOD_POST, payLoad.toString(), headers);
			addJsonMonitor(url, RestClient.METHOD_POST, payLoad.toString(), jsonResponse);
		} catch (Exception e) {
			LOGGER.error("Error sending schedule series to NDVR: " + e.getMessage());
		}
		return jsonResponse;
	}
	
	private JSONObject changeRecOptionsOnNDVR() throws JSONException{
		JSONObject jsonResponse = null;
		String subscriber = clientMessage.getString("subscriberName");
		String userId = clientMessage.getString("userId");
		String recordingSetType = clientMessage.getString("recordingSetType");
		String recordingSetId = clientMessage.getString("recordingSetId");
		JSONObject options = clientMessage.getJSONObject("options");
		String end = options.optString("endOffset");
		if(end.length()>0){
			options.put("endOffset", end);
		}
		String start = options.optString("startOffset");
		if(start.length()>0){
			options.put("startOffset", start);
		}
		String recordingId = clientMessage.getString("recordingId");
		String url = getBaseCSUrl() + config.getNDVRRecPreferencesService();
		url = url.replace("{valueSubscriber}", subscriber);
		url = url.replace("{recordingId}", recordingId);
		url = url.replace("{userId}", userId);
		url = url.replace("{recordingSetType}", recordingSetType);
		url = url.replace("{recordingSetId}", recordingSetId);
		
		JSONObject payload = options;
		JSONObject headers = new JSONObject();
		headers.put(RestClient.QUOTA_HEADER, true);
		try {
			jsonResponse = sendRequest(url, RestClient.METHOD_PUT, payload.toString(), headers);
			addJsonMonitor(url, RestClient.METHOD_PUT, payload.toString(), jsonResponse);
		} catch (Exception e) {
			jsonResponse = new JSONObject();
			jsonResponse.put("ERROR", "VCRC: Error sending new recording options to NDVR: " + e.getMessage());
			addJsonMonitor(url, RestClient.METHOD_PUT, payload.toString(), jsonResponse);
			LOGGER.info("Error sending new recording options to NDVR: " + e.getMessage());
		}
		return jsonResponse;
	}
	
	private JSONObject changeSeriesOptionsOnNDVR() throws JSONException{
		JSONObject jsonResponse = null;
		String subscriber = clientMessage.getString("subscriberName");
		String userId = clientMessage.getString("userId");
		String recordingSetId = clientMessage.getString("recordingSetId");
		JSONObject options = clientMessage.getJSONObject("options");
		String end = options.optString("endOffset");
		if(end.length()>0){
			options.put("endOffset", end);
		}
		String start = options.optString("startOffset");
		if(start.length()>0){
			options.put("startOffset", start);
		}
		String url = getBaseCSUrl() + config.getNDVRSeriesOptions();
		url = url.replace("{valueSubscriber}", subscriber);
		url = url.replace("{userId}", userId);
		url = url.replace("{recordingSetId}", recordingSetId);
		
		JSONObject payload = options;
		JSONObject headers = new JSONObject();
		headers.put(RestClient.QUOTA_HEADER, true);
		try {
			jsonResponse = sendRequest(url, RestClient.METHOD_PUT, payload.toString(), headers);
			addJsonMonitor(url, RestClient.METHOD_PUT, payload.toString(), jsonResponse);
		} catch (Exception e) {
			jsonResponse = new JSONObject();
			jsonResponse.put("ERROR", "VCRC: Error sending new recording options to NDVR: " + e.getMessage());
			addJsonMonitor(url, RestClient.METHOD_PUT, payload.toString(), jsonResponse);
			LOGGER.info("Error sending new recording options to NDVR: " + e.getMessage());
		}
		return jsonResponse;
	}
	
	private JSONObject scheduleOnNDVR() throws JSONException{
		JSONObject jsonResponse = null;
		String recordingSetType = clientMessage.getString("recordingSetType");
		String recordingSetId = clientMessage.getString("recordingSetId");
		String subscriber = clientMessage.getString("subscriberName");
		String userId = clientMessage.getString("userId");
		JSONObject options = clientMessage.getJSONObject("options");
		float end = options.getInt("endOffset");
		options.put("endOffset", String.valueOf(end));
		String start = options.optString("startOffset");
		if(start!=null && start.length()>0){
			options.put("startOffset", start);
		}
		String airingId = clientMessage.getJSONObject("item").getJSONObject("metadata").getString("airingId");
		String url = getBaseCSUrl() + config.getNDVRScheduleService();
		url = url.replace("{valueSubscriber}", subscriber);
		url = url.replace("{userId}", userId);
		url = url.replace("{recordingSetType}", recordingSetType);
		url = url.replace("{recordingSetId}", recordingSetId);
		JSONObject payload = new JSONObject();
		payload.put("airingId", airingId);
		payload.put("options", options);
		JSONObject headers = new JSONObject();
		headers.put(RestClient.QUOTA_HEADER, true);
		try {
			jsonResponse = sendRequest(url, RestClient.METHOD_POST, payload.toString(), headers);
			addJsonMonitor(url, RestClient.METHOD_POST, payload.toString(), jsonResponse);
		} catch (Exception e) {
			LOGGER.error("Error sending schedule to NDVR: " + e.getMessage());
		}
		return jsonResponse;
	}

	private JSONObject markAsKeepForEver() throws JSONException{
		JSONObject jsonResponse = null;
		String url = getBaseCSUrl() + config.getNdvrRecordEndpoint();
		String recordRefId = clientMessage.getString("recordingRefId");
		url = url + "/" + recordRefId;
		try {
			jsonResponse = sendRequest(url, RestClient.METHOD_GET, false);
			JSONObject json = jsonResponse.getJSONArray("entities").getJSONObject(0);
			json.put("keepforever", "true");
			String payload = json.toString();
			url = url.substring(0,url.indexOf("?"));
			jsonResponse = sendRequest(url, RestClient.METHOD_PUT, payload);
		} catch (Exception e) {
			LOGGER.info("Error sending schedule to NDVR: " + e.getMessage());
		}
		return jsonResponse;
	}
}
