package com.demo.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.demo.util.RestClient;

/**
 * This class represents the service that retrieve the records from NDVR service
 * 
 *  
 *  @author Iacono Diego
 *
 */
public class ServiceGet extends Service {
	static final Logger LOGGER = Logger.getLogger(ServiceGet.class);
	public static final String FILTER_RECORDING = "recordingFilter";
	public static final String FILTER_DELETED = "deletedFilter";
	public static final String FILTER_MSO = "msoFilter";
	public static final String FILTER_SCHEDULE = "scheduleFilter";
	public static final String ITEM_RECORDING_SCHEDULE ="RecordingsSchedules";
	public static final String ITEM_MSO = "MSO";
	public static final String CATCHUP_TV = "CATCHUP_TV";
	public static final String CHANNEL_RECORDING_SET = "channels";
	public static final String SERIES_RECORDING_SET = "series";
	public static final String RECORDINGS = "RECORDINGS";
	public static final String DELETED = "DELETED";
	public static final String ERROR = "ERROR";
	public static final String SCHEDULED = "SCHEDULED";
	public static final int LATEST_PERSONAL_RECORDING_TYPE = 1;
	public static final int TSTV_RECORDING_TYPE = 2;
	public static final int SCHEDULED_RECORDING_TYPE = 3;
	private JSONObject responseHeader = null;
	
	/**
	 * @param posterAvailable
	 * @param posterBdFile
	 * @param posterNotAvailableUrl
	 * @param clientMessage
	 * @param baseUrl
	 * @param serviceUri
	 */
	public ServiceGet(){
	}
	
	private JSONObject getCatchupSets(){
		JSONObject jsonResponse = null;
		String response  = null;
		String url = getBaseCSUrl() + config.getNDVRrecordingSets();
		JSONObject headers = new JSONObject();
		try {
			url = url.replace("{valueSubscriber}", clientMessage.getString("subscriber"));
			url = url.replace("{userId}", clientMessage.getString("userId"));
			url = url.replace("{recordingSetType}", CHANNEL_RECORDING_SET);
			headers.put(RestClient.QUOTA_HEADER, true);
			response = sendRequest(url, headers);
			
			if(!availableMockResponses){
				jsonResponse = new JSONObject(response);
			}else{
				/*mock file for development purposes*/
				jsonResponse = config.readJsonMock("catchupTvRecordings.json");
			}
			
		} catch (Exception e) {
			LOGGER.error("Error getting catchup sets: " + e.getMessage());
			try {
				jsonResponse = new JSONObject("{'ERROR' : 'Error getting catchup sets'}");
			} catch (JSONException e1) {
				LOGGER.error("Error: " + e.getMessage());
			}
		}
		return jsonResponse;
	}
	
	
	private JSONObject getSeriesSets(){
		JSONObject jsonResponse = null;
		String response  = null;
		String url = getBaseCSUrl() + config.getNDVRrecordingSets();
		JSONObject headers = new JSONObject();
		try {
			url = url.replace("{valueSubscriber}", clientMessage.getString("subscriber"));
			url = url.replace("{userId}", clientMessage.getString("userId"));
			url = url.replace("{recordingSetType}",SERIES_RECORDING_SET + "");
			headers.put(RestClient.QUOTA_HEADER, true);
			response = sendRequest(url, headers);
			
			if(!availableMockResponses){
				jsonResponse = new JSONObject(response);
			}else{
				/*mock file for development purposes*/
				jsonResponse = config.readJsonMock("seriesRecordingSets.json");
			}

			fillSeriesEpisodes(jsonResponse);
		} catch (Exception e) {
			LOGGER.error("Error getting series sets: " + e.getMessage());
			try {
				jsonResponse = new JSONObject("{'ERROR' : 'Error getting series sets'}");
			} catch (JSONException e1) {
				LOGGER.error("Error: " + e.getMessage());
			}
		}
		return jsonResponse;
	}
	
	private void fillSeriesEpisodes(JSONObject jsonResponse){
		try {
			JSONArray seriesCollection = jsonResponse.getJSONArray("entities");
			for(int i =0; i< seriesCollection.length(); i++){
				JSONObject seriesElement =  seriesCollection.getJSONObject(i);
				String recordingsUrl = seriesElement.optString("recordingsURI");
				if(recordingsUrl!=null && !recordingsUrl.isEmpty()){
					addSeriesEpisodes(recordingsUrl, seriesElement);	
				}
			}
		} catch (JSONException e) {
			LOGGER.error("Error: " + e.getMessage());
		}
	}
	
	private void addSeriesEpisodes(String recordingsUrl, JSONObject seriesObj){
		JSONObject jsonResponse = new JSONObject();	
		if(recordingsUrl!=null && !recordingsUrl.isEmpty()){
			final String url = getBaseCSUrl() + recordingsUrl;
			try {
				
				if(!availableMockResponses){
					jsonResponse = sendRequest(url, RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD);
				}else{
					jsonResponse = config.readJsonMock("seriesRecordings.json");
				}

				if(jsonResponse.getJSONArray("entities").length()>0){
					JSONArray episodesCollection = jsonResponse.getJSONArray("entities");
					seriesObj.put("recordings", episodesCollection);
				}
			} catch (Exception e) {
				LOGGER.error("ERROR - getting Series episodes " + e.getMessage());
			}
		}
	}
	
	private Collection<JSONObject> getRecordingReferences(String type) {
		String response  = null;
		JSONObject jsonResponse = null;
		Collection<JSONObject> responsePages = null;
		try {
			String subscriber = clientMessage.getString("subscriber");
			String userId = clientMessage.getString("userId");
			String url = getBaseCSUrl() + config.getNdvrRecordEndpoint();
			switch (type) {
			case DELETED:
				
				if(availableMockResponses){
				   /*mock file for development purposes*/
				   response  = config.readJsonMock("personalDeleted.json").toString();
				}
				break;
			case RECORDINGS:
				if(availableMockResponses){
				   /*mock file for development purposes*/
	  			   response  = config.readJsonMock("personalRecordings.json").toString();	
				}
				break;
			case SCHEDULED:
				if(availableMockResponses){
					/*mock file for development purposes*/
					response  = config.readJsonMock("personalSchedule.json").toString();
				}
				break;

			default:
				break;
			}
			url = url.replace("{valueSubscriber}", subscriber);
			url = url.replace("{userId}", userId);
			JSONObject headers = new JSONObject();
			headers.put(RestClient.QUOTA_HEADER, true);
			if(!availableMockResponses){
				response = sendRequest(url, headers);
			}
			if(response.indexOf("\"count\"")< 0 && (!(response.indexOf("entities")>0) && response.indexOf("ERROR")>0)){
				try{
					jsonResponse = new JSONObject(response);
				}
				catch(JSONException ex){
					jsonResponse = new JSONObject("{'ERROR' : 'Not Reachable'}");
				}
				responsePages = new ArrayList<JSONObject>();
				responsePages.add(jsonResponse);
				return responsePages;
			}
			if (isNextPagePresent(response)) {
					jsonResponse = new JSONObject(response);
					responsePages = getnextPages(jsonResponse, type);
			}else {
				responsePages = new ArrayList<JSONObject>();
				jsonResponse = new JSONObject(response);
				JSONArray jsonArray = jsonResponse.getJSONArray("entities");
				for(int i=0;i<jsonArray.length();i++){
					JSONObject jsonItem = jsonArray.getJSONObject(i);
					responsePages.add(jsonItem);
				}
			}
		} catch (Exception e) {
			LOGGER.error("Error connection: " + e.getMessage());
			responsePages = new ArrayList<JSONObject>();
			try {
				jsonResponse = new JSONObject("{\"ERROR\": \"connection refuse\"}");
				responsePages.add(jsonResponse);
			} catch (JSONException e1) {
				LOGGER.error("Error: " + e.getMessage());
			}
		}
		responseHeader = jsonResponse.optJSONObject("responseHeader");
		return responsePages;
	}
	

	private boolean isNextPagePresent(String response) {
		boolean exist = false;
		try {
			JSONObject responseObj = new JSONObject(response);
			responseObj.getString("next");
			exist = true;
		} catch (JSONException e) {
			if (e.getMessage().equals("JSONObject[\"next\"] not found")) {
				exist = false;
			}
		}
		return exist;
	}
	
	private Collection<JSONObject> getnextPages(JSONObject jsonResponse, String type){
		ArrayList<JSONObject> responsePageList = new ArrayList<JSONObject>();
		boolean nextPage = true;
		try {
			addToList(jsonResponse,responsePageList,type);
			while(nextPage){
				String urlNextPage = jsonResponse.getString("next");
				String url = getBaseCSUrl() + urlNextPage;
				String responsePage = sendRequest(url);
				nextPage = isNextPagePresent(responsePage);
				JSONObject responsePageJson = new JSONObject(responsePage);
				addToList(responsePageJson,responsePageList,type);
			}

		} catch (JSONException e) {
			e.printStackTrace();
		} catch (Exception e) {
			e.printStackTrace();
		}
		return responsePageList;
	}
	
	/**
	 * @param jsonList
	 * @param responsePageList
	 * @param type
	 * @throws JSONException
	 */
	private void addToList(JSONObject jsonList, List<JSONObject> responsePageList, String type) throws JSONException{
		JSONArray jsonArray = jsonList.getJSONArray("entities");
		for(int i=0;i<jsonArray.length();i++){
			JSONObject jsonItem = jsonArray.getJSONObject(i);
			responsePageList.add(jsonItem);
		}
	}
	
	
	private Collection<JSONObject> getResponseMock(JSONObject mockJson){
		
		Collection<JSONObject> list = new ArrayList<JSONObject>();
		try {
			JSONArray jsonArray = mockJson.getJSONArray("entities");
			for(int i=0;i<jsonArray.length();i++){
				JSONObject mockResponse = jsonArray.getJSONObject(i);
				list.add(addAditionalAtrribute(mockResponse));
			}
		} catch (JSONException e) {
			LOGGER.error("ERROR - Reading MOCK Json. " + e.getMessage());
		}
		
		return list;
	}

	private JSONObject addAditionalAtrribute(JSONObject jsonResponse) throws JSONException{
		String programId = jsonResponse.getString("programId");
		String poster = null;
        jsonResponse.put("poster", poster);
		return jsonResponse;
	}
	
	public JSONObject getCatchupPrograms(JSONObject clientMessage){
		JSONObject jsonResponse = new JSONObject();
		final String recordingsUrl = clientMessage.optString("recordingsURI");		
		if(recordingsUrl!=null && !recordingsUrl.isEmpty()){
			final String url = getBaseCSUrl() + recordingsUrl;
			try {
				jsonResponse = sendRequest(url, RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD);
				addJsonMonitor(url, RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD, jsonResponse);
			} catch (Exception e) {
				LOGGER.error("ERROR - getting recordingSet programs " + e.getMessage());
			}
		}
		return jsonResponse;
	}
	
	public Collection<JSONObject> getResponseSubDeletion() {
		Collection<JSONObject> responseNdvrInfo = null;
    	responseNdvrInfo = getRecordingReferences(DELETED);
		return responseNdvrInfo;
	}
	
	public Collection<JSONObject> getResponseSubRecordings() {
		Collection<JSONObject> responseNdvrInfo;
		responseNdvrInfo = getRecordingReferences(RECORDINGS);
		return responseNdvrInfo;
	}
	
	public Collection<JSONObject> getResponseSubSchedules() {
		Collection<JSONObject> responseNdvrInfo;
	    responseNdvrInfo = getRecordingReferences(SCHEDULED);
	
		return responseNdvrInfo;
	}

	public JSONObject getResponseMSOInfo() {
		return getCatchupSets();
	}

	
	public JSONObject getResponseSeriesInfo() {
		return getSeriesSets();
	}
	
	public JSONObject getResponseHeader() {
		return responseHeader;
	}
}
