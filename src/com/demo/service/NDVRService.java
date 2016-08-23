package com.demo.service;

import org.json.*;
public interface NDVRService {
	public JSONObject sendRequest(String url, String method) throws Exception, JSONException;
}
