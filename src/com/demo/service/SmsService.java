package com.demo.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.demo.epg.model.Channel;
import com.demo.epg.model.ChannelPackage;
import com.demo.epg.model.Subscriber;
import com.demo.util.ConfigReader;
import com.demo.util.RestClient;

public class SmsService extends Service {

	private static final Logger LOGGER = Logger.getLogger(SmsService.class);
	private ConfigReader config = ConfigReader.getInstance();

	/**
	 * @param config
	 * @param clientMessage
	 */
	public SmsService() {
		this.config = ConfigReader.getInstance();
	}

	public Subscriber getSubscriber(String subscriberName) {
		Subscriber subcriber = null;
		JSONObject jsonObject = null;

		String url = getBaseSmsUrl() + config.getSubscriberService();
		url = url.replace("{subscriber}", subscriberName);
		ChannelPackage channelPackage = null;
		try {
			jsonObject = sendRequest(url, RestClient.METHOD_GET);
			if (!isError()) {
				subcriber = new Subscriber(jsonObject);
				JSONArray chnPcks = jsonObject.getJSONArray("channelPackages");
				List<ChannelPackage> channelPackages = new ArrayList<ChannelPackage>();
				subcriber.setChannelPackages(channelPackages);
				for (int i = 0; i < chnPcks.length(); ++i) {
					JSONObject chnPck = chnPcks.getJSONObject(i);

					channelPackage = getChannelPackage(chnPck.getString("id"));
					if (channelPackage != null) {
						channelPackages.add(channelPackage);
					}
				}
			} else {
				LOGGER.error("Subscriber not found: " + jsonObject.getString("ERROR"));
			}
		} catch (Exception e) {
			LOGGER.error("Error sending schedule to NDVR: " + e.getMessage());
		}
		return subcriber;
	}
	
	public JSONObject createUser(){
		String url = getBaseSmsUrl() + config.getNDVRUserService();
		JSONObject jsonResponse = null;
		try{
			String subscriberName = clientMessage.getString("subscriberName");
			String payload = clientMessage.getString("payload");
			url = url.replace("{subscriberName}", subscriberName);
			jsonResponse = sendRequest(url, RestClient.METHOD_PUT, payload);
			JSONArray payloadObj = new JSONArray(payload);
			addJsonMonitor(url, RestClient.METHOD_PUT, payloadObj, jsonResponse);
		}catch(Exception ex){
			LOGGER.error("ERROR - creating user");
		}
		return jsonResponse;
	}
	
	
	public JSONObject deleteUser(){
		String url = getBaseSmsUrl() + config.getNDVRUserService() + "/{userId}";
		JSONObject jsonResponse = null;
		try{
			String subscriberName = clientMessage.getString("subscriberName");
			String userId = clientMessage.getString("userId");
			url = url.replace("{subscriberName}", subscriberName);
			url = url.replace("{userId}", userId);
			jsonResponse = sendRequest(url, RestClient.METHOD_DELETE, RestClient.EMPTY_PAYLOAD);
			addJsonMonitor(url, RestClient.METHOD_DELETE, RestClient.EMPTY_PAYLOAD, jsonResponse);
		}catch(Exception ex){
			LOGGER.error("ERROR - creating user");
		}
		return jsonResponse;
	}
	
	public JSONObject getUsers(){
		String url = getBaseSmsUrl() + config.getNDVRUserService();
		JSONObject jsonResponse = null;
		try{
			String subscriberName = clientMessage.getString("subscriberName");
			url = url.replace("{subscriberName}", subscriberName);
			jsonResponse = sendRequest(url, RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD);
			addJsonMonitor(url, RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD, jsonResponse);
		}catch(Exception ex){
			LOGGER.error("ERROR - getting users");
		}
		return jsonResponse;
	}
	
	public JSONObject validateSubscriber(String subscriberName){
		String url = getBaseSmsUrl() + config.getSubscriberService();
		url = url.replace("{subscriber}", subscriberName);
		JSONObject jsonResponse = null;
		try{
			if(!availableMockResponses){
				jsonResponse = sendRequest(url, RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD);
			}else{
				/* Mock for Subscriber Validation*/
				jsonResponse = config.readJsonMock("subscriberValidation.json");	
			}
			addJsonMonitor(url, RestClient.METHOD_GET, RestClient.EMPTY_PAYLOAD, jsonResponse);
			String error = jsonResponse.optString("ERROR");
			if(error!=null){
				List<JSONObject> channelList = new ArrayList<JSONObject>();
				JSONArray chnPcks = jsonResponse.getJSONArray("channelPackages");
				ChannelMapController chnMapController = new ChannelMapController();
				JSONArray filteredIPTVChannels = chnMapController.filterIPTVChannelMap();
				for (int i = 0; i < chnPcks.length(); ++i) {
					JSONObject chnPck = chnPcks.getJSONObject(i);
					JSONObject channelObj = getChannelPackageJson(chnPck.getString("id"));
					JSONArray channels = channelObj.getJSONArray("channels");
					if(channels!=null && channels.length()>0){
						chnMapController.addIPTVChannelInfo(filteredIPTVChannels, channels);
					}
					channelList.add(channelObj);
				}
				JSONObject packageService = jsonResponse.getJSONObject("servicePackage");
				JSONObject packageServiceInfo = getServicePackageInfo(packageService.getString("uri"));
				
				jsonResponse.put("channels", channelList);
				jsonResponse.put("servicePackageInfo", packageServiceInfo);
			}
		}catch(Exception ex){
			LOGGER.error("ERROR - validating Subscriber: " + subscriberName);
		}
		return jsonResponse;
	}
	
	private JSONObject getChannelPackageJson(String id){
		JSONObject response = null;
		String urlChnPck = getBaseSmsUrl() + config.getChannelPackageService();
		urlChnPck = urlChnPck.replace("{channelPackage}", id);
		try {
			response = sendRequest(urlChnPck, RestClient.METHOD_GET);
		} catch (Exception e) {
			LOGGER.error("Error parsing channel package json: " + e.getMessage());
		}
		return response;
	}
	
	private JSONObject getServicePackageInfo(String uri){
		JSONObject response = null;
		String url = getBaseSmsUrl() + uri;
		try {
			if(!availableMockResponses){
				response = sendRequest(url, RestClient.METHOD_GET);
			}else{
				response = config.readJsonMock("servicePackageMock.json");
			}
		} catch (Exception e) {
			LOGGER.error("Error parsing Servicepackage json: " + e.getMessage());
		}
		return response;
	}

	public ChannelPackage getChannelPackage(String id) {
		ChannelPackage channelPackage = null;
		String urlChnPck = getBaseSmsUrl() + config.getChannelPackageService();
		urlChnPck = urlChnPck.replace("{channelPackage}", id);
		try {
			JSONObject response = sendRequest(urlChnPck, RestClient.METHOD_GET);

			if (!this.isError()) {
				channelPackage = new ChannelPackage(response);
			} else {
				LOGGER.error("Error sending " + urlChnPck + " request to SMS: " + response.getString("ERROR"));
			}
		} catch (JSONException e) {
			LOGGER.error("Error parsing channel package json: " + e.getMessage());
		} catch (Exception e) {
			LOGGER.error("Error sending " + urlChnPck + " request to SMS: " + e.getMessage());
		}

		return channelPackage;
	}

	public List<Channel> getChannels(String subscriberName) {

		Subscriber subscriber = this.getSubscriber(subscriberName);
		List<Channel> channels = null;
		if (subscriber != null) {
			List<ChannelPackage> channelPackages = subscriber.getChannelPackages();
			Map<String, Channel> channelMap = new HashMap<String, Channel>();
			if (channelPackages != null && channelPackages.size() > 0) {
				for (ChannelPackage channelPackage : channelPackages) {
					for (Channel channel : channelPackage.getChannels()) {
						if (!channelMap.containsKey(channel.getStation_channel_id())) {
							channelMap.put(channel.getStation_channel_id(), channel);
						}
					}
				}
			}

			if (channelMap.size() > 0) {
				channels = new ArrayList<Channel>(channelMap.values());
			} else {
				channels = new ArrayList<Channel>();
			}
		}
		return channels;
	}
}
