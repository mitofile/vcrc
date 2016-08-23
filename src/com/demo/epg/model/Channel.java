package com.demo.epg.model;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;

public class Channel {
	static final Logger LOGGER = Logger.getLogger(Channel.class);
	
	private String station_channel_id = null;
	private String station_id = null;
	private String call_sign;
	private String uri;
	private int channelId;

	public Channel() {

	}

	public Channel(JSONObject channel) {
		this.parse(channel);
	}

	public String getStation_channel_id() {
		return station_channel_id;
	}

	public void setStation_channel_id(String station_channel_id) {
		this.station_channel_id = station_channel_id;
	}

	public String getStation_id() {
		return station_id;
	}

	public void setStation_id(String station_id) {
		this.station_id = station_id;
		try{
			this.channelId = Integer.parseInt(station_id);	
		}catch( NumberFormatException ex){
			this.channelId = 0;
		}
	}

	public String getName() {
		return call_sign;
	}

	public void setName(String call_sign) {
		this.call_sign = call_sign;
	}

	public String toString() {
		StringBuffer strbuffer = new StringBuffer();
		strbuffer.append("{");
		strbuffer.append("\"station_channel_id\"" + ":" + "\""	+ station_channel_id + "\"");
		strbuffer.append(",");
		strbuffer.append("\"station_id\"" + ":" + "\"" + station_id + "\"");
		strbuffer.append(",");
		strbuffer.append("\"channelId\"" + ":" + channelId );
		strbuffer.append(",");
		strbuffer.append("\"call_sign\"" + ":" + "\"" + call_sign + "\"");
		if(uri!=null && uri.length()>0){
			strbuffer.append(",");
			strbuffer.append("\"uri\"" + ":" + "\"" + uri + "\"");	
		}
		strbuffer.append("}");
		return strbuffer.toString();
	}

	public static final String QUERY_CHANNEL_LIST = "SELECT station_channel.station_channel_id, "
			+ "station_channel.station_id, station_channel.call_sign "
			+ "FROM station_channel "
			+ "ORDER BY station_channel.station_channel_id ASC";

	public static final String QUERY_CONFIGURED_CHANNEL_LIST = "Select call_sign, station_channel.station_channel_id, "
			+ "station_channel.station_id from station_channel where station_channel.station_id in ({channelList})";

	private void parse(JSONObject json) {
		try {
			if (json.has("stationId")) {
				this.station_channel_id = json.getString("stationId");
			} else {
				this.station_channel_id = json.getString("id");
				LOGGER.debug("Channel.parse: stationId undefined, using id=" + this.station_channel_id);
			}
			
			this.call_sign = json.getString("name");
			setStation_id(json.getString("id"));
		} catch (JSONException e) {
			LOGGER.error("ERROR getting Channel " + ((this.call_sign!=null)?this.call_sign:"") + ", description: " + e.getMessage());
		}
	}

	public String getUri() {
		return uri;
	}

	public void setUri(String uri) {
		this.uri = uri;
	}

	public int getChannelId() {
		return channelId;
	}
}
