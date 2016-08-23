package com.demo.service;

import java.net.URL;

import org.apache.log4j.Logger;
import org.json.*;

import com.demo.util.*;

public class ServicePlayback extends Service{
	static final Logger LOGGER = Logger.getLogger(ServicePlayback.class);
	private static final String PROGRAM_TYPE_CATCHUP = "CATCHUP_TV";


	public ServicePlayback(JSONObject clientMessage){
		this.clientMessage = clientMessage;
	}
	
	public JSONObject getPlaybackSession() throws JSONException {
		JSONObject jsonResponse = null;
		String url = null;
		String subscriber = clientMessage.getString("subscriberName");
		String userId = clientMessage.getString("userId");
		String recordingId = clientMessage.getString("recordingId");
		String type = clientMessage.optString("type");
		String recordingSetId = clientMessage.optString("recordingSetId");
		JSONObject payload = clientMessage.getJSONObject("payload");
		String recordingURI = config.getNdvrRecordEndpoint();
		recordingURI = recordingURI.replace("{valueSubscriber}", subscriber);
		recordingURI = recordingURI.replace("{userId}", userId);
		recordingURI = recordingURI + "/" + recordingId;
		payload.put("recordingURI", recordingURI);
		
		LOGGER.info("Creating session playback for recordingId: " + recordingId + ", and Subscriber: " + subscriber);
		if(type!=null && !type.isEmpty() && PROGRAM_TYPE_CATCHUP.equals(type)){
			url = getBaseFMUrl() + config.getFullfilmentCatchup();
			url = url.replace("{recordingSetId}", recordingSetId);
		}else{
			url = getBaseFMUrl() + config.getFullfilmentEndPoint();	
		}
		url = url.replace("{valueSubscriber}", subscriber);
		url = url.replace("{userId}", userId);
		
		String method = RestClient.METHOD_POST;
		JSONObject headers = new JSONObject();
		headers.put(RestClient.SUBSCRIBER_HEADER, subscriber);
		try {
			if(!availableMockResponses){
				jsonResponse = sendRequest(url, method, payload.toString(), headers);
			}else{
				jsonResponse = config.readJsonMock("playbackSession.json");
			}
			addJsonMonitor(url, method, payload.toString(), jsonResponse);
			try{
				String playUrl = jsonResponse.getString("playbackUri");
				if (config.getPlayableIp() != null && config.getPlayableIp().length() > 0) {
					LOGGER.info("Playback Url : " + playUrl);
					URL urlAsset = new URL(playUrl);
					String host = urlAsset.getHost();
					playUrl = playUrl.replace(host, config.getPlayableIp());
					jsonResponse.put("playbackUri", playUrl);
				}
			}catch(JSONException ex){
				LOGGER.error("ERROR - "  + ex.getMessage());
			}
		} catch (JSONException e) {
			LOGGER.error("Error - " + e.getMessage());
		} catch (Exception e) {
			e.printStackTrace();
		}
		return jsonResponse;
	}
	
	public JSONObject sendKeepAlive() throws JSONException {
		JSONObject jsonResponse = null;
		String url = null;
		String subscriber = clientMessage.getString("subscriberName");
		String userId = clientMessage.getString("userId");
		String recordingSetId = clientMessage.optString("recordingSetId");
		String sessionId = clientMessage.getString("sessionId");
		JSONObject payload = clientMessage.getJSONObject("payload");
		String type = clientMessage.optString("type");
		if(type!=null && !type.isEmpty() && PROGRAM_TYPE_CATCHUP.equals(type)){
			url = getBaseFMUrl() + config.getFullfilmentKeepAliveCatchup();
			url = url.replace("{recordingSetId}", recordingSetId);
		}else{
			url = getBaseFMUrl() + config.getFullfilmentKeepAlive();
		}
		url = url.replace("{valueSubscriber}", subscriber);
		url = url.replace("{userId}", userId);
		url = url.replace("{sessionId}", sessionId);
		JSONObject headers = new JSONObject();
		headers.put(RestClient.SUBSCRIBER_HEADER, subscriber);
		String method = RestClient.METHOD_PUT;
		try {
			//jsonResponse = config.readJsonMock("playbackSession.json");
			jsonResponse = sendRequest(url, method, payload.toString(), headers);
			addJsonMonitor(url, method, payload.toString(), jsonResponse);
		} catch (JSONException e) {
			LOGGER.error("Error sending KeepAlive - " + e.getMessage());
		} catch (Exception e) {
			LOGGER.error("Error sending KeepAlive - " + e.getMessage());
		}
		return jsonResponse;
	}

	
	public JSONObject sendTrickPlayEvent() throws JSONException {
		JSONObject jsonResponse = null;
		String url = null;
		String subscriber = clientMessage.getString("subscriberName");
		String recordingId = clientMessage.getString("recordingId");
		String sessionId = clientMessage.getString("sessionId");
		JSONObject payload = clientMessage.getJSONObject("payload");
		url = getBaseFMUrl() + config.getFullfilmentEvent();
		url = url.replace("{valueSubscriber}", subscriber);
		url = url.replace("{recordingId}", recordingId);
		url = url.replace("{sessionId}", sessionId);
		JSONObject headers = new JSONObject();
		headers.put(RestClient.SUBSCRIBER_HEADER, subscriber);
		String method = RestClient.METHOD_POST;
		try {
			//jsonResponse = config.readJsonMock("playbackSession.json");
			jsonResponse = sendRequest(url, method, payload.toString(), headers);
			addJsonMonitor(url, method, payload.toString(), jsonResponse);
		} catch (JSONException e) {
			LOGGER.error("Error sending KeepAlive - " + e.getMessage());
		} catch (Exception e) {
			LOGGER.error("Error sending KeepAlive - " + e.getMessage());
		}
		return jsonResponse;
	}
	
}
