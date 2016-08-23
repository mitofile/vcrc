package com.demo.epg.model;

import java.util.ArrayList;
import java.util.List;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class ChannelPackage {

	static final Logger LOGGER = Logger.getLogger(ChannelPackage.class);

	private String id;
	private String name;
	private List<Channel> channels;

	public ChannelPackage() {
	}

	public ChannelPackage(JSONObject jsonObject) {
		this.parse(jsonObject);
	}

	private void parse(JSONObject json) {
		JSONObject chn;
		Channel channel;
		try {
			this.id = json.getString("id");
			this.name = json.getString("name");
			JSONArray chns = json.optJSONArray("channels");
			channels = new ArrayList<Channel>();
			if(chns!=null){
				for (int i = 0; i < chns.length(); i++) {
					chn = chns.getJSONObject(i);
					channel = new Channel(chn);
					if(validateStation(channel.getStation_id())){
						channels.add(channel);
					}
				}
			}
		} catch (JSONException e) {
			LOGGER.error("ERROR parsing json (ChannelPackage): " + e.getMessage());
		}
	}
	
	private boolean validateStation(String stationId){	
	  boolean isNumber = true;
	  if(stationId != null){
		  try{
			  Integer.valueOf(stationId);		  
		  }catch( NumberFormatException ex){
			  isNumber = false;
		  }
		  return  isNumber && !stationId.trim().equals("0");
	  }
	  return false;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public List<Channel> getChannels() {
		return channels;
	}

	public void setChannels(List<Channel> channels) {
		this.channels = channels;
	}
}
