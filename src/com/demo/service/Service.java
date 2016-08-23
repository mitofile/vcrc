package com.demo.service;

import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.demo.util.ConfigReader;
import com.demo.util.RestClient;

/**
 * @author diacono
 *
 */
public abstract class Service implements NDVRService {
	static final Logger LOGGER = Logger.getLogger(Service.class);
	protected static final String STATUS_DELETED = "DELETED";
	protected static final String STATUS_COMPLETED = "COMPLETED";
	protected static final String RS_STATUS_ACTIVE = "ACTIVE";
	protected static final String RS_STATUS_INACTIVE = "INACTIVE";
	protected static final String RS_STATUS_DELETED = "DELETED";
	protected ConfigReader config = ConfigReader.getInstance();
	protected JSONObject clientMessage;
	protected final String base_cs_url = config.HTTP_PROTOCOL + config.getCSIpPort();
	protected final String base_fm_url = config.HTTP_PROTOCOL + config.getFMIpPort();
	protected final String base_ems_url = config.HTTP_PROTOCOL + config.getEmsIpPort();
	protected final String base_sms_url = config.HTTP_PROTOCOL + config.getSmsIpPort();
	protected boolean availableMockResponses = true;
	private boolean error = false;
	

	public String sendRequest(String url) throws Exception, JSONException {
		return sendRequest(url, new JSONObject());
	}

	public String sendRequest(String url, JSONObject headers) throws Exception, JSONException {
		RestClient restClient = new RestClient(RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD);
		restClient.sendRequest(url, false, headers);
		JSONObject response = new JSONObject(restClient.getResponseResult()); 
		JSONObject resposeHeaderObj = headerToJSONObject(restClient.getResponseHeader());
		response.put("responseHeader", resposeHeaderObj);
		return response.toString();
	}
	
	public JSONObject sendRequest(String url, String method) throws Exception, JSONException {
		return sendRequest(url, method, true);
	}

	public JSONObject sendRequest(String url, String method, boolean monitorHeader) throws Exception, JSONException {
		this.error = false;
		JSONObject jsonResponse = null;
		RestClient restClient = new RestClient(method, RestClient.EMPTY_PAYLOAD);
		restClient.sendRequest(url, true);
		jsonResponse = new JSONObject(restClient.getResponseResult());
		if (monitorHeader) {
			jsonResponse.put("header", restClient.getHeaderSent());
		}
		this.error = restClient.isError();
		return jsonResponse;
	}

	public JSONObject sendRequest(String url, String method, String payload, JSONObject headers) throws Exception, JSONException {
		return sendRequest(url, method, payload, true, headers);
	}
	
	public JSONObject sendRequest(String url, String method, String payload) throws Exception, JSONException {
		return sendRequest(url, method, payload, true, new JSONObject());
	}

	public JSONObject sendRequest(String url, String method, String payload, boolean monitorHeader, JSONObject headers) throws Exception, JSONException {
		this.error = false;
		JSONObject jsonResponse = null;
		RestClient restClient = new RestClient(method, payload);
		restClient.sendRequest(url, true, headers);
		if(restClient.getResponseResult().isEmpty() && !restClient.isError()){
			jsonResponse = new JSONObject();
		}else{
			jsonResponse = new JSONObject(restClient.getResponseResult());
		}

		if (monitorHeader) {
			jsonResponse.put("header", restClient.getHeaderSent());
		}
		Map<String, List<String>> responseHeader = restClient.getResponseHeader();
		if (headers.length() > 0 && responseHeader!=null) {
			JSONObject headerResponse = headerToJSONObject(responseHeader);
			jsonResponse.put("headerResponse", headerResponse);
		}
		this.error = restClient.isError();
		return jsonResponse;
	}
	
	private void addJsonMonitorInfo(String url, String method, Object payloadSent, JSONObject response) throws JSONException {
		JSONObject jsonMonitor = new JSONObject();
		jsonMonitor.put("header", response.optString("header"));
		response.remove("header");
		jsonMonitor.put("url", url);
		jsonMonitor.put("method", method);
		jsonMonitor.put("payload", payloadSent);
		JSONObject headerResponse = response.optJSONObject("headerResponse");
		if(headerResponse!=null){
			jsonMonitor.put("responseHeader", headerResponse);
		}
		response.remove("headerResponse");
		response.put("monitor", jsonMonitor);
	}
	
	public void addJsonMonitor(String url, String method, String payload, JSONObject response) throws JSONException {
		JSONObject payloadSent = new JSONObject(payload);
		addJsonMonitorInfo(url, method, payloadSent, response);
	}
	
	public void addJsonMonitor(String url, String method, JSONArray payload, JSONObject response) throws JSONException {		
		addJsonMonitorInfo(url, method, payload, response);
	}
	private JSONObject headerToJSONObject(Map<String, List<String>> header) throws JSONException{
		JSONObject jsonObj = new JSONObject();
		if (header != null) {
			for(Map.Entry<String, List<String>> entry : header.entrySet()){
				JSONArray valueList = new JSONArray();
				valueList.put(entry.getValue());
				String strKey = "null";
				if(entry.getKey()!=null){
					strKey = entry.getKey();
				}
				jsonObj.put(strKey, valueList);
			}
		}
		return jsonObj;
	}

	protected JSONObject changeAssetStateOnDVR(String recordingSetType,String recordingSetId, String recordingId, String subscriber, String userId, String newState) throws JSONException {
		LOGGER.info("Changing recording state, id:" + recordingId + " to: " + newState);
		JSONObject jsonResponse = null;
		JSONObject payload = new JSONObject();
		payload.put("state", newState);
		String url = getBaseCSUrl() + config.getNDVRStateService();
		url = url.replace("{recordingId}", recordingId);
		url = url.replace("{userId}", userId);
		url = url.replace("{valueSubscriber}", subscriber);
		url = url.replace("{recordingSetType}", recordingSetType);
		url = url.replace("{recordingSetId}", recordingSetId);
		try {
			JSONObject headers = new JSONObject();
			headers.put(RestClient.QUOTA_HEADER, true);
			jsonResponse = sendRequest(url, RestClient.METHOD_POST, payload.toString(), headers);
			addJsonMonitor(url, RestClient.METHOD_POST, payload.toString(), jsonResponse);
		} catch (Exception e) {
			LOGGER.error("Error sending newState to NDVR: " + e.getMessage());
		}
		return jsonResponse;
	}
	
	protected JSONObject changeSeriesStateOnDVR(String recordingSetId, String subscriber, String userId, String newState) throws JSONException {
		LOGGER.info("Changing recordingSet state, id:" + recordingSetId + " to: " + newState);
		JSONObject jsonResponse = null;
		JSONObject payload = new JSONObject();
		payload.put("state", newState);
		String url = getBaseCSUrl() + config.getNDVRStatusSeries();
		url = url.replace("{recordingSetId}", recordingSetId);
		url = url.replace("{userId}", userId);
		url = url.replace("{valueSubscriber}", subscriber);
		try {
			JSONObject headers = new JSONObject();
			headers.put(RestClient.QUOTA_HEADER, true);
			jsonResponse = sendRequest(url, RestClient.METHOD_POST, payload.toString(), headers);
			addJsonMonitor(url, RestClient.METHOD_POST, payload.toString(), jsonResponse);
		} catch (Exception e) {
			LOGGER.error("Error sending newState to NDVR: " + e.getMessage());
		}
		return jsonResponse;
	}
	
	protected JSONObject changeRecordingStatusTo(String newStatus){
		JSONObject jsonResponse = null;
		try {
			String recordingId = clientMessage.getString("recordingId");
			String subscriber = clientMessage.getString("subscriberName");
			String userId = clientMessage.getString("userId");
			String recordingSetId = clientMessage.getString("recordingSetId");
			String recordingSetType = clientMessage.getString("recordingSetType");
			jsonResponse = changeAssetStateOnDVR(recordingSetType,recordingSetId,recordingId, subscriber, userId, newStatus);
		} catch (JSONException e) {
			LOGGER.error("ERROR on newStatus Item. " + e.getMessage());
		}
		return jsonResponse;
	}

	protected String getBaseCSUrl() {
		return base_cs_url;
	}

	protected String getBaseFMUrl() {
		return base_fm_url;
	}

	public String getBaseEmsUrl() {
		return base_ems_url;
	}

	public String getBaseSmsUrl() {
		return base_sms_url;
	}

	protected boolean isError() {
		return error;
	}

	public void setClientMessage(JSONObject clientMessage) {
		this.clientMessage = clientMessage;
	}
}
