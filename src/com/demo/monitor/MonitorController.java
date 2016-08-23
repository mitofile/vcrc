package com.demo.monitor;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.sql.SQLException;
import java.util.*;

import org.apache.log4j.Logger;
import org.json.*;

import com.demo.service.Service;
import com.demo.util.*;

public class MonitorController extends Service {
	static final Logger LOGGER = Logger.getLogger(MonitorController.class);
	private static final String RECORDING_ID_INFO_URL = "/cs/v3/recordings/{recordingId}";
	private ConfigReader config = null;
	
	public void createTestFile(String subscriber, JSONArray content){
		config = ConfigReader.getInstance();
		String filePath = config.getMonitorFilesPath() + "/" + subscriber;
		Date d = new Date();
		String fileName  = "/test" + d.getTime() + ".txt";
		int count = content.length();
		StringBuilder strContent = new StringBuilder();
		for(int i=0;count-1>=i;i++){
			try {
				if(strContent.length()>0){
					strContent.append(",");
				}
				strContent.append(content.getString(i));
			} catch (JSONException e) {
				LOGGER.error("ERROR " + e.getMessage());
			}
		}
		try {
			FileUtil.writeFile(filePath + fileName, strContent.toString(), true);
		} catch (IOException e) {
			e.printStackTrace();
		}	
	}
	
	public String getBaseHTTP(String uri){
		String component  = uri.substring(1, uri.indexOf("/", 1));
		String baseUrl = "";
		switch (component) {
		case "fm":
			baseUrl = getBaseFMUrl();
			break;
		case "sms":
			baseUrl = getBaseSmsUrl();
			break;
		case "cs":
			baseUrl = getBaseCSUrl();
			break;
		case "ems":
			baseUrl = getBaseEmsUrl();
			break;
		default:
			break;
		}
		return baseUrl;
	}
	
	public String getBaseHTTPByName(String component){
		String baseUrl = "";
		switch (component) {
		case "CS":
			baseUrl = getBaseCSUrl() + RECORDING_ID_INFO_URL;
			break;
		default:
			break;
		}
		return baseUrl;
	}
		
	private boolean hasHostName(String uri){
		URL url;
		boolean result = false;
		try {
			url = new URL(uri);
			String hostName = url.getHost();
			result = (hostName!=null && hostName.length()>0);
		} catch (MalformedURLException e) {
			LOGGER.error("ERROR - parsing url: " + e.getMessage());
		}
		return result;
	}
	
	
	/**
	 * @param recordingId
	 * @return
	 */
	public JSONObject getUriObj(String uri){
		JSONObject jsonResponse = null;
		if(hasHostName(uri)){
			URL url;
			try {
				url = new URL(uri);
				uri = url.getPath();
			} catch (MalformedURLException e) {
				LOGGER.error("ERROR - parsing url: " + e.getMessage());
			}
		}
		String url = getBaseHTTP(uri) + uri;
		try {
			jsonResponse = sendRequest(url, RestClient.METHOD_GET);
		} catch (Exception e) {
			LOGGER.info("Error sending get URI to NDVR: " + e.getMessage());
		}
		return jsonResponse;
	} 
	
	
	/**
	 * @param recordingId
	 * @return
	 */
	public JSONObject getIdObj(String id, String component){
		JSONObject jsonResponse = null;
		String url = getBaseHTTPByName(component);
		url = url.replace("{recordingId}", id);
		try {
			jsonResponse = sendRequest(url, RestClient.METHOD_GET);
		} catch (Exception e) {
			LOGGER.info("Error sending get URI to NDVR: " + e.getMessage());
		}
		return jsonResponse;
	} 
	
	public String readFile(String subscriber, String fileName){
		config = ConfigReader.getInstance();
		//String filePath = config.getMonitorFilesPath() + "/" + subscriber + "/" + fileName;
		//String content = FileUtil.readStatus(filePath);
		return null;
	}
}
