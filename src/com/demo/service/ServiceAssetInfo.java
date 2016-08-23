package com.demo.service;


import org.apache.log4j.Logger;
import org.json.*;

import com.demo.util.*;

/**
 * This Class is responsible to retrieve the MWS information to be used for delete purposes. 
 * 
 * @author Iacono Diego
 *
 */
public class ServiceAssetInfo extends Service {
	static final Logger LOGGER = Logger.getLogger(ServiceAssetInfo.class);
	private ConfigReader config = ConfigReader.getInstance();
	private JSONObject clientMessage;
	private Record record = null;

	
	/**
	 * @param config
	 * @param clientMessage
	 */
	public ServiceAssetInfo(JSONObject clientMessage) {
		this.clientMessage = clientMessage;
	}
	
	public ServiceAssetInfo(Record record) {
		this.config = ConfigReader.getInstance();
		this.record = record;
	}
	
	public JSONObject getLatestStatus() {
		LOGGER.info("Getting latest status of Asset on NDVR");
		JSONObject jsonResponse = null;
		try {
				String recordingId = clientMessage.getString("recordingId");
				String subscriber = clientMessage.getString("subscriberName");
				String userId = clientMessage.getString("userId");
				String url = getBaseCSUrl() + config.getNdvrRecordEndpoint();
				url = url.replace("{valueSubscriber}", subscriber);
				url = url.replace("{userId}", userId);
				url = url + "/" + recordingId;
				JSONObject headers = new JSONObject();
				headers.put(RestClient.QUOTA_HEADER, true);
				if(!availableMockResponses){
					jsonResponse = sendRequest(url, RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD, headers);
				}else{
					jsonResponse = config.readJsonMock("itemRecordingMock.json");
				}
				addJsonMonitor(url, RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD, jsonResponse);
				
		} catch (JSONException e) {
			LOGGER.error("Error getting recordingId from Client : " + e.getMessage());
		} catch (Exception e) {
			LOGGER.error(e.getMessage());
		}
		
		return jsonResponse;
	}

	
	/**
	 * @return
	 */
	public JSONObject getProgramInfo() {
		LOGGER.debug("Getting Program metadata");
		JSONObject jsonResponse = null;
		try {
			String url = getBaseCSUrl() + clientMessage.getString("programUrl");
			JSONObject headers = new JSONObject();
			headers.put(RestClient.QUOTA_HEADER, true);
			if(!availableMockResponses){
				jsonResponse = sendRequest(url, RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD, headers);
			}else{
			  jsonResponse = config.readJsonMock("programData.json");
			}
			addJsonMonitor(url, RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD, jsonResponse);
		} catch (Exception e) {
			LOGGER.info("ERROR - Program info: " + e.getMessage());
		}

		return jsonResponse;
	}
	
}
