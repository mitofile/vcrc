package com.demo.service;

import org.apache.log4j.Logger;
import org.json.*;

import com.demo.util.RestClient;

public class ServicesSubscriber extends Service {
	static final Logger LOGGER = Logger.getLogger(ServicesSubscriber.class);
	
	public ServicesSubscriber(JSONObject clientMessage){
		this.clientMessage = clientMessage;
	}
	
	public JSONObject getSubscriberPreferences() {
		JSONObject jsonResponse = new JSONObject();
		try {
			LOGGER.info("getting Subscriber preferences: subscriber " + clientMessage.getString("subscriberName"));
			jsonResponse = getPreferencesOnNDVR();
		} catch (JSONException e) {
			LOGGER.error("ERROR getting subscriber preferences. " + e.getMessage());
		}

		return jsonResponse;
	}
	
	public JSONObject saveSubscriberPreferences() {
		JSONObject jsonResponse = new JSONObject();
		try {
			LOGGER.info("Saving Subscriber preferences: subscriber " + clientMessage.getString("subscriberName"));
			jsonResponse = sendPreferencesOnNDVR();
		} catch (JSONException e) {
			LOGGER.error("ERROR saving subscriber preferences. " + e.getMessage());
		}

		return jsonResponse;
	}
	
	
	private JSONObject sendPreferencesOnNDVR() throws JSONException{
		JSONObject jsonResponse = null;
		String subscriber = clientMessage.getString("subscriberName");
		JSONObject payLoad = clientMessage.getJSONObject("options");
		float end = payLoad.getInt("endOffset");
		payLoad.put("endOffset", String.valueOf(end));
		float start = payLoad.getInt("startOffset");
		payLoad.put("startOffset", String.valueOf(start));
		String url = getBaseCSUrl() + config.getNDVRPreferencesService();
		url = url.replace("{valueSubscriber}", subscriber);
		try {
			jsonResponse = sendRequest(url, RestClient.METHOD_PUT, payLoad.toString());
			addJsonMonitor(url, RestClient.METHOD_PUT, payLoad.toString(), jsonResponse);
		} catch (Exception e) {
			LOGGER.info("Error saving Subscriber preferences: " + e.getMessage());
		}
		return jsonResponse;
	}
	
	private JSONObject getPreferencesOnNDVR() throws JSONException{
		JSONObject jsonResponse = null;
		String subscriber = clientMessage.getString("subscriberName");
		String url = getBaseCSUrl() + config.getNDVRPreferencesService();
		url = url.replace("{valueSubscriber}", subscriber);
		try {
			jsonResponse = sendRequest(url, RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD);
			addJsonMonitor(url, RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD, jsonResponse);
		} catch (Exception e) {
			LOGGER.info("Error getting Subscriber preferences: " + e.getMessage());
		}
		return jsonResponse;
	}
	
}
