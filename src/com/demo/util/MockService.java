package com.demo.util;

import java.io.IOException;
import java.util.ArrayList;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * This class is responsible in mimic all the action that can be executed in this application.
 * 
 * @author Iacono Diego
 *
 */
public class MockService {
	private final String MOCK_STATUS_DISCARDED = "DISCARDED";
	private final String MOCK_STATUS_SCHEDULED = "SCHEDULED";
	private final String MOCK_STATUS_DELETED = "DELETED";
	private final String MOCK_STATUS_CANCELED = "CANCELED";
	private final String MOCK_STATUS_FINISHED = "FINISHED";
	private final String STATUS_COMPLETED = "COMPLETED";
	private final String STATUS_CAPTURING = "CAPTURING";
	private ConfigReader config = null;
	static final Logger LOGGER = Logger.getLogger(MockService.class);
	
	public MockService() {
		config = ConfigReader.getInstance();
	}
	
	
	/**
	 * @return
	 * @throws JSONException
	 */
	public JSONObject scheduleMockRecord(JSONObject scheduleItem) throws JSONException {
		String mockNameSchedules = "personalSchedule.json";
		String mockTemplate = "itemScheduleMock.json";
		String mockPosters = "LocalPosterBD.json";
		JSONObject jsonMockPosters = config.readMock(mockPosters);
		JSONArray posterArray = jsonMockPosters.getJSONArray("posters");
	    int posterIndex = 1 + (int)(Math.random() * (((posterArray.length()-1) - 1) + 1));
		JSONObject mockJSchedules = config.readJsonMock(mockNameSchedules);
		JSONArray schedulesArray = mockJSchedules.getJSONArray("entities");
		JSONObject mockJsonTemplate = config.readJsonMock(mockTemplate);
		int index = 7000 + schedulesArray.length();
		String airingId = scheduleItem.getJSONObject("item").getJSONObject("metadata").getString("airingId");
		String title = scheduleItem.getJSONObject("item").getJSONObject("metadata").getString("title");
		mockJsonTemplate.getJSONObject("scheduleEvent").put("id", index);
		mockJsonTemplate.put("id", index);
		mockJsonTemplate.getJSONObject("scheduleEvent").put("airingId", airingId);
		mockJsonTemplate.getJSONObject("recording").getJSONObject("program").put("airingId", airingId);
		mockJsonTemplate.getJSONObject("recording").getJSONObject("program").put("originalTitle", title);
		mockJsonTemplate.getJSONObject("recording").getJSONObject("program").put("programId", posterArray.getString(posterIndex).replace(".jpg", ""));
		schedulesArray.put(mockJsonTemplate);
		updateMockFile(mockNameSchedules, mockJSchedules);
		JSONObject jsonResponse = new JSONObject();
		JSONObject jsonItem = new JSONObject();
		jsonItem.put("status", MOCK_STATUS_SCHEDULED);
		JSONArray jsonArray = new JSONArray();
		jsonArray.put(jsonItem);
		jsonResponse.put("entities", jsonArray);
		return jsonResponse;
	}
	
	/**
	 * @return
	 * @throws JSONException
	 */
	public JSONObject scheduleSeriesMock(JSONObject scheduleItem) throws JSONException {
		String mockNameSchedules = "personalSchedule.json";
		String mockTemplate = "itemSerieMock.json";
		String mockPosters = "LocalPosterBD.json";
		JSONObject jsonMockPosters = config.readMock(mockPosters);
		JSONArray posterArray = jsonMockPosters.getJSONArray("posters");
	    int posterIndex = 1 + (int)(Math.random() * (((posterArray.length()-1) - 1) + 1));
		JSONObject mockJSchedules = config.readJsonMock(mockNameSchedules);
		JSONArray schedulesArray = mockJSchedules.getJSONArray("entities");
		JSONObject mockJsonTemplate = config.readJsonMock(mockTemplate);
		String airingId = scheduleItem.getJSONObject("item").getJSONObject("metadata").getString("airingId");
		String title = scheduleItem.getJSONObject("item").getJSONObject("metadata").getString("title");
		String seriesId = scheduleItem.getJSONObject("item").getJSONObject("metadata").getString("altSeries");
		int index = 7000 + schedulesArray.length();
		for(int i=0;i<3;i++){
			mockJsonTemplate.getJSONObject("scheduleEvent").put("id", index);
			mockJsonTemplate.put("id", index);
			mockJsonTemplate.put("status", MOCK_STATUS_SCHEDULED);
			mockJsonTemplate.getJSONObject("scheduleEvent").put("airingId", airingId);
			mockJsonTemplate.getJSONObject("scheduleEvent").put("status", MOCK_STATUS_SCHEDULED);
			mockJsonTemplate.getJSONObject("recording").put("status", MOCK_STATUS_SCHEDULED);
			mockJsonTemplate.getJSONObject("recording").getJSONObject("program").put("airingId", airingId);
			mockJsonTemplate.getJSONObject("recording").getJSONObject("program").put("originalTitle", title);
			mockJsonTemplate.getJSONObject("recording").getJSONObject("program").put("seriesId", seriesId);
			mockJsonTemplate.getJSONObject("recording").getJSONObject("program").put("programId", posterArray.getString(posterIndex).replace(".jpg", ""));
			mockJsonTemplate.getJSONObject("scheduleEvent").put("seriesId", seriesId);
			schedulesArray.put(mockJsonTemplate);
			updateMockFile(mockNameSchedules, mockJSchedules);
			index = index + 1;
		}
		JSONObject jsonResponse = new JSONObject();
		JSONObject jsonItem = new JSONObject();
		jsonItem.put("status", MOCK_STATUS_SCHEDULED);
		JSONArray jsonArray = new JSONArray();
		jsonArray.put(jsonItem);
		jsonResponse.put("entities", jsonArray);
		return jsonResponse;
	}
	
	/**
	 * @return
	 * @throws JSONException
	 */
	public JSONObject deleteMockRecord(String scheduleEventId, String type) throws JSONException {
		String mockName = null;
		if(STATUS_COMPLETED.equals(type) || STATUS_CAPTURING.equals(type)){
			mockName = "personalRecordings.json";
		}else{
			mockName = "personalSchedule.json";
		}
		return deleteMock(MOCK_STATUS_DISCARDED, scheduleEventId, mockName);
	}
	
	/**
	 * @return
	 * @throws JSONException
	 */
	public JSONObject deleteMockEpisode(String scheduleEventId, String type) throws JSONException {
		String mockName = null;
		if(STATUS_COMPLETED.equals(type) || STATUS_CAPTURING.equals(type)){
			mockName = "personalRecordings.json";
		}else{
			mockName = "personalSchedule.json";
		}
		return deleteMock(MOCK_STATUS_DELETED,scheduleEventId, mockName);
	}
		
	private JSONObject deleteMock(String resultStatus, String scheduleEventId, String mockName)  throws JSONException{
		JSONObject jsonResponse;
		LOGGER.info("faking delete item on NDVR and Moxi");
		jsonResponse = new JSONObject();
		JSONObject jsonItem = new JSONObject();
		jsonItem.put("status", resultStatus);
		JSONArray jsonArray = new JSONArray();
		jsonArray.put(jsonItem);
		jsonResponse.put("entities", jsonArray);
		JSONObject mockJson = config.readJsonMock(mockName);
		JSONArray jsonArrayMock = mockJson.getJSONArray("entities");
		ArrayList<JSONObject> jsonList = new ArrayList<JSONObject>();
		for(int i=0;i<jsonArrayMock.length();i++){
			JSONObject jsonObj = jsonArrayMock.getJSONObject(i);
			JSONObject jsonSchedule = jsonObj.getJSONObject("scheduleEvent");
			String itemId = jsonSchedule.getString("id");
			if(!itemId.equals(scheduleEventId)){
				jsonList.add(jsonObj);
			}
		}
		updateMockFile(mockName, jsonList);
		return jsonResponse;
	}
	
	/**
	 * @return
	 * @throws JSONException
	 */
	public JSONObject deleteSeriesMock(String scheduleEventId) throws JSONException {
		JSONObject jsonResponse;
		LOGGER.info("faking delete Series on NDVR");
		jsonResponse = new JSONObject();
		JSONObject jsonItem = new JSONObject();
		jsonItem.put("status", MOCK_STATUS_DELETED);
		JSONArray jsonArray = new JSONArray();
		jsonArray.put(jsonItem);
		jsonResponse.put("entities", jsonArray);
		String mockName = "personalRecordings.json";
		JSONObject mockJson = config.readJsonMock(mockName);
		JSONArray jsonArrayMock = mockJson.getJSONArray("entities");
		ArrayList<JSONObject> jsonList = new ArrayList<JSONObject>();
		String seriesId = null;
		for(int i=0;i<jsonArrayMock.length();i++){
			JSONObject jsonObj = jsonArrayMock.getJSONObject(i);
			JSONObject jsonSchedule = jsonObj.getJSONObject("scheduleEvent");
			String itemId = jsonSchedule.getString("id");
			if(itemId.equals(scheduleEventId)){
				seriesId = jsonSchedule.getString("seriesId");
				break;
			}
		}
		for(int i=0;i<jsonArrayMock.length();i++){
			JSONObject jsonObj = jsonArrayMock.getJSONObject(i);
			JSONObject jsonSchedule = jsonObj.getJSONObject("scheduleEvent");
			String itemSeriesId = null;
			try{
				 itemSeriesId = jsonSchedule.getString("seriesId");
			}catch(JSONException ex){}
			
			if(!seriesId.equals(itemSeriesId)){
				jsonList.add(jsonObj);
			}
		}
		updateMockFile(mockName, jsonList);
		return jsonResponse;
	}

	/**
	 * @return
	 * @throws JSONException
	 */
	public JSONObject cancelSeriesMock(String scheduleEventId) throws JSONException {
		JSONObject jsonResponse;
		LOGGER.info("faking cancel ScheduleSeries on NDVR");
		jsonResponse = new JSONObject();
		JSONObject jsonItem = new JSONObject();
		jsonItem.put("status", MOCK_STATUS_FINISHED);
		JSONArray jsonArray = new JSONArray();
		jsonArray.put(jsonItem);
		jsonResponse.put("entities", jsonArray);
		JSONObject mockJson = null;
		String mockName = "personalSchedule.json";
		mockJson = config.readJsonMock(mockName);
		
		JSONArray jsonArrayMock = mockJson.getJSONArray("entities");
		ArrayList<JSONObject> jsonList = new ArrayList<JSONObject>();
		String seriesId = null;
		for(int i=0;i<jsonArrayMock.length();i++){
			JSONObject jsonObj = jsonArrayMock.getJSONObject(i);
			JSONObject jsonSchedule = jsonObj.getJSONObject("scheduleEvent");
			String itemId = jsonSchedule.getString("id");
			if(itemId.equals(scheduleEventId)){
				seriesId = jsonSchedule.getString("seriesId");
				break;
			}
		}
		for(int i=0;i<jsonArrayMock.length();i++){
			JSONObject jsonObj = jsonArrayMock.getJSONObject(i);
			JSONObject jsonSchedule = jsonObj.getJSONObject("scheduleEvent");
			String itemSeriesId = null;
			try{
				 itemSeriesId = jsonSchedule.getString("seriesId");
			}catch(JSONException ex){}
			
			if(!seriesId.equals(itemSeriesId)){
				jsonList.add(jsonObj);
			}
		}
		updateMockFile(mockName, jsonList);
		return jsonResponse;
	}
	
	/**
	 * @return
	 * @throws JSONException
	 */
	public JSONObject cancelMockEpisode(String recordingRefId) throws JSONException {
		JSONObject jsonResponse;
		LOGGER.info("faking cancel Episode on NDVR and Moxi");
		jsonResponse = new JSONObject();
		JSONObject jsonItem = new JSONObject();
		jsonItem.put("status", MOCK_STATUS_CANCELED);
		JSONArray jsonArray = new JSONArray();
		jsonArray.put(jsonItem);
		jsonResponse.put("entities", jsonArray);
		String mockName = "personalSchedule.json";
		JSONObject mockJson = config.readJsonMock(mockName);;
		JSONArray jsonArrayMock = mockJson.getJSONArray("entities");
		ArrayList<JSONObject> jsonList = new ArrayList<JSONObject>();
		for(int i=0;i<jsonArrayMock.length();i++){
			JSONObject jsonObj = jsonArrayMock.getJSONObject(i);
			String itemId = jsonObj.getString("id");
			if(!itemId.equals(recordingRefId)){
				jsonList.add(jsonObj);
			}
		}
		updateMockFile(mockName, jsonList);
		return jsonResponse;
	}
	
	/**
	 * @param mockName
	 * @param jsonList
	 * @throws JSONException
	 */
	private void updateMockFile(String mockName, ArrayList<JSONObject> jsonList)
			throws JSONException {
		JSONObject jsonMockResult = new JSONObject();
		jsonMockResult.put("entities", jsonList);
		String targetPath = config.getJsonMockPath(mockName);
		try {
			FileUtil.writeFile(targetPath, jsonMockResult.toString().trim());
		} catch (IOException e) {
			LOGGER.error("Error updating dinamic mock. " + e.getMessage());
		}
	}
	
	/**
	 * @param mockName
	 * @param jsonList
	 * @throws JSONException
	 */
	private void updateMockFile(String mockName,JSONObject jsonItem)
			throws JSONException {
		String targetPath = config.getJsonMockPath(mockName);
		try {
			FileUtil.writeFile(targetPath, jsonItem.toString().trim());
		} catch (IOException e) {
			LOGGER.error("Error updating dinamic mock. " + e.getMessage());
		}
	}
	
}
