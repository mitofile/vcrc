package com.demo.service;

import java.io.IOException;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.demo.epg.model.Channel;
import com.demo.util.ConfigReader;
import com.demo.util.FileUtil;

public class ChannelMapController {
	private static final String IPTV_CHANNEL_MAP_FILE = "iptvChannelMap.json";
	private ConfigReader config = ConfigReader.getInstance();
	static final Logger LOGGER = Logger.getLogger(ChannelMapController.class);
	
	public JSONObject readChannelMap(){
		return config.readJson(IPTV_CHANNEL_MAP_FILE);
	}
	
	public JSONObject updateChannelMap(JSONObject iptvChannelMap){
		JSONObject jsonResult = null;
		String path = config.getJsonPath(IPTV_CHANNEL_MAP_FILE);
	    try {
			FileUtil.writeFile(path, iptvChannelMap.toString());
		} catch (IOException e) {
			jsonResult = new JSONObject();
			try {
				jsonResult.put("ERROR", e.getMessage());
			} catch (JSONException e1) {
				jsonResult = new JSONObject();
			}
			LOGGER.error("ERROR - " + e.getMessage());
		}
	    if(jsonResult==null){
	    	jsonResult = new JSONObject();
	    	try {
				jsonResult.put("message", "success");
			} catch (JSONException e) {
				jsonResult = new JSONObject();
			}
	    }
		return jsonResult;
	}
	
	public void addIPTVChannelInfo(JSONArray filteredIPTVChannels, JSONArray channels){
		try {
			for(int x = 0; x < channels.length(); x++){
				JSONObject channel = channels.getJSONObject(x);
				if (!channel.has("stationId")) {
					String id = channel.getString("id");
					channel.put("stationId", id);
					LOGGER.debug("addIPTVChannelInfo: stationId undefined, using id=" + id);
				}
				String stationId = channel.getString("stationId");
				for(int i = 0; i < filteredIPTVChannels.length(); i++){
					JSONObject iptvChannel = filteredIPTVChannels.getJSONObject(i);
					if(iptvChannel.getString("stationId").equals(stationId)){
						channel.put("uri", iptvChannel.getString("uri"));
						break;
					}
				}
			}
		} catch (JSONException e) {
			LOGGER.error("ERROR - " + e.getMessage());
		}
	}
	
	public void addIPTVChannelInfo(JSONArray filteredIPTVChannels, Channel channel) {
		try {
			for (int i = 0; i < filteredIPTVChannels.length(); i++) {
				JSONObject iptvChannel = filteredIPTVChannels.getJSONObject(i);
				if (iptvChannel.getString("stationId").equals(String.valueOf(channel.getStation_id()))) {
					channel.setUri(iptvChannel.getString("uri"));
					break;
				}
			}
		} catch (JSONException e) {
			LOGGER.error("ERROR - " + e.getMessage());
		}
	}
	
	
	public JSONArray filterIPTVChannelMap(){
		JSONArray result = new JSONArray();
		ChannelMapController chnController = new ChannelMapController();
		JSONObject iptvChnMap =  chnController.readChannelMap();
		String cfgIPTVChannelMap = config.getIPTVChannelMap();
		try {
			JSONArray iptvChMapArray = iptvChnMap.getJSONArray("channelMap");
			for(int i = 0; i < iptvChMapArray.length(); i++ ){
				String labName = iptvChMapArray.getJSONObject(i).names().getString(0);
				if(cfgIPTVChannelMap.equals(labName)){
					return iptvChnMap.getJSONArray("channelMap").getJSONObject(0).getJSONArray(labName);	
				}
			}
		} catch (JSONException e) {
			LOGGER.error("Error parsing channel package json: " + e.getMessage());
		}
		return result;
	}

}
