package com.demo.service;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.demo.epg.model.Channel;
import com.demo.epg.model.Program;
import com.demo.service.EmsService;
import com.demo.service.SmsService;

public class EmsController extends Service {

	private static final Logger LOGGER = Logger.getLogger(EmsController.class);
	private EmsService emsService;
	private SmsService smsService;
	
	public EmsController() {
		this.emsService = new EmsService();
		this.smsService = new SmsService();
	}

	public EmsController(EmsService emsService, SmsService smsService) {
		this.emsService = emsService;
		this.smsService = smsService;
	}

	public Collection<JSONObject> getProgramGuide(String channelList, long start, long end) throws JSONException {
		List<Program> programs = null;
		Collection<JSONObject> result = new ArrayList<JSONObject>();
		if(!availableMockResponses){
			programs = emsService.getProgramGuide(channelList, start, end);
			for (Program program : programs) {
				result.add(new JSONObject(program.toString()));
			}
		}else{
			
			JSONObject emsMockJson = config.readJsonMock("emsMock.json");
        	JSONArray epgGuideData = emsMockJson.getJSONArray("data");
        	for(int i=0;i<epgGuideData.length();i++){
        	   JSONObject jsonProg = epgGuideData.getJSONObject(i);
        	   String air_date_Sync = syncDate(jsonProg.getLong("air_date"));
        	   jsonProg.put("air_date", air_date_Sync);
        	   String end_date_Sync = syncDate(jsonProg.getLong("end_date"));
        	   jsonProg.put("end_date", end_date_Sync);
        	   result.add(jsonProg);
        	}
		}

		return result;
	}
	
	private String syncDate(long from){
		Date fromDate = new Date(from * 1000L);
		SimpleDateFormat sdf =  new SimpleDateFormat("dd");
		String day = sdf.format(fromDate);

		Date now = new Date();
		SimpleDateFormat sdfNow =  new SimpleDateFormat("dd");
		String dayNow = sdfNow.format(now);	
		Calendar cal = Calendar.getInstance();
		cal.setTime(fromDate);
		
		if(day.equals("04")){
			cal.set(Calendar.DAY_OF_MONTH, Integer.valueOf(dayNow));
			cal.add(Calendar.MONTH, 1);
			return String.valueOf(cal.getTime().getTime()/1000L);

		}else{
			cal.add(Calendar.DAY_OF_MONTH, 1);
			cal.add(Calendar.MONTH, 1);
			return String.valueOf(cal.getTime().getTime()/1000L);
		}

	}

	public JSONObject getProgramMetadata(String programId) {
		Program program = null;
		program = emsService.getProgramMetadata(programId);
		return new JSONObject(program);
	}

	public Collection<JSONObject> getChannelList(String subscriberName) throws JSONException {
		List<Channel> channels = null;
		List<JSONObject> channelListJson = new ArrayList<JSONObject>();
		if(!availableMockResponses){
			channels = smsService.getChannels(subscriberName);
			
			if (channels != null && channels.size() > 0) {
				ChannelMapController chnMapController = new ChannelMapController();
				JSONArray filteredIPTVChannels = chnMapController.filterIPTVChannelMap();
				for (Channel channel : channels) {
					chnMapController.addIPTVChannelInfo(filteredIPTVChannels, channel);
					channelListJson.add(new JSONObject(channel.toString()));
				}
			}

			Collections.sort(channelListJson, new Comparator<JSONObject>() {
				@Override
				public int compare(JSONObject o1, JSONObject o2) {
					try {
						return o1.getString("station_id").compareTo(o2.getString("station_id"));
					} catch (JSONException e) {
						LOGGER.error("error sorting channel list: " + e.getMessage());
						e.printStackTrace();
						return 0;
					}
				}
			});
		}else{
			 JSONObject response = config.readJsonMock("channelsMock.json");
			 JSONArray arrayChannels = response.getJSONArray("channels");
			 for(int i =0; i< arrayChannels.length(); i++){
				 channelListJson.add(arrayChannels.getJSONObject(i));
			 }
		}


		return channelListJson;
	}

	public Collection<JSONObject> getRecordableChannels(String subscriberName) throws JSONException {
		return this.getChannelList(subscriberName);
	}

}
