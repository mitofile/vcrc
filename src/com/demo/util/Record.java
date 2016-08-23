package com.demo.util;

/**
 * @author Iacono Diego
 *
 */
public class Record {
	private String stationId = null;
	private String contentId = null;
	private String showBegin = null;
	private String type = null;
	private String subscriber = null;
	
	public Record(String stationId, String contentId, String showBegin, String type, String subscriber) {
	   this.stationId = stationId;
	   this.contentId = contentId;
	   this.showBegin = showBegin;
	   this.type = type;
	   this.subscriber = subscriber;
	}
	
	public String getStationId() {
		return stationId;
	}
	public void setStationId(String stationId) {
		this.stationId = stationId;
	}
	public String getContentId() {
		return contentId;
	}
	public void setContentId(String contentId) {
		this.contentId = contentId;
	}
	public String getShowBegin() {
		return showBegin;
	}
	public void setShowBegin(String showBegin) {
		this.showBegin = showBegin;
	}
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
	public String getSubscriber() {
		return subscriber;
	}

	public void setSubscriber(String subscriber) {
		this.subscriber = subscriber;
	}
	
}
