package com.demo.epg.model;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;

public class Subscriber {

	static final Logger LOGGER = Logger.getLogger(Subscriber.class);

	private final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX");
	private String id;
	private String name;
	private List<ChannelPackage> channelPackages;
	private Date statusChangeDate;
	private String status;

	public Subscriber() {
	}

	public Subscriber(JSONObject json) {
		parseJson(json);
	}

	public void parseJson(JSONObject json) {
		try {
			this.status = json.getString("status");
			this.id = json.getString("id");
			this.name = json.getString("name");
			String dateStr = json.getString("statusChangeDate");
			this.statusChangeDate = sdf.parse(dateStr);
		} catch (JSONException e) {
			LOGGER.error("ERROR parsing json (subscriber)");
			e.printStackTrace();
		} catch (ParseException e) {
			LOGGER.error("ERROR parsing date");
			String dateStr;
			try {
				dateStr = json.getString("statusChangeDate");
				SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX");
				this.statusChangeDate = sdf.parse(dateStr);
			} catch (JSONException | ParseException e1) {
				LOGGER.error("ERROR parsing date - retry with yyyy-MM-dd'T'HH:mm:ss.SSSX " + e.getMessage());
			}

		}
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

	public List<ChannelPackage> getChannelPackages() {
		return channelPackages;
	}

	public void setChannelPackages(List<ChannelPackage> channelPackages) {
		this.channelPackages = channelPackages;
	}

	public Date getStatusChangeDate() {
		return statusChangeDate;
	}

	public void setStatusChangeDate(Date statusChangeDate) {
		this.statusChangeDate = statusChangeDate;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

}
