
package com.demo.service;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collection;
import java.util.TimeZone;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.apache.log4j.MDC;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.demo.util.ConfigReader;
import com.demo.util.NdvrMoxiSynchro;

/**
 * @author Iacono Diego Servlet implementation class ServerService
 */
public class ServerService extends HttpServlet {
    private static final long serialVersionUID = 1L;
    public static final String ACTION_FAVORITE = "FAVORITE";
    public static final String ACTION_PREFERENCES = "PREFERENCES";
    public static final String ACTION_KEEP_ALIVE = "KEEP_ALIVE";
    public static final String ACTION_SAVE_SUB_PREFERENCES = "SAVE_PREFERENCES";
    public static final String ACTION_REC_PREFERENCES = "REC_PREFERENCES";
    public static final String ACTION_SERIES_PREFERENCES = "SERIES_PREFERENCES";
    public static final String ACTION_KEEPFOREVER = "KEEPFOREVER";
    public static final String ACTION_SAVE_FAVORITE = "SAVE_FAVORITE";
    public static final String ACTION_VALIDATE_SUBSCRIBER = "VALIDATE_SUBSCRIBER";
    public static final String ACTION_CREATE_NEW_USER = "CREATE_USER";
    public static final String ACTION_DELETE_USER = "DELETE_USER";
    public static final String ACTION_GET_USERS = "GET_USERS";
    public static final String ACTION_GUIDE_LAZY_LOAD = "ACTION_GUIDE_LAZY_LOAD";
    public static final String ACTION_GUIDE_PROGRAM_DATA = "GUIDE_PROGRAM_DATA";
    public static final String ACTION_GUIDE_CHANNEL_DATA = "GUIDE_CHANNEL_DATA";
    public static final String ACTION_PROGRAM_INFO = "GETPROGRINFO";
    public static final String ACTION_GET = "GET";
    public static final String ACTION_SCHEDULE = "SCHEDULE";
    public static final String ACTION_CANCEL_SCHEDULE = "CANCEL_SCHEDULE";
    public static final String ACTION_SCHEDULE_SERIES = "SCHEDULE SERIES";
    public static final String ACTION_DELETE = "DELETE";
    public static final String ACTION_RESTORE = "RESTORE";
    public static final String ACTION_DELETE_SERIES = "DELETE_SERIES";
    public static final String ACTION_CANCEL_SERIES = "CANCEL_SERIES";
    public static final String ACTION_STOP = "STOP";
    public static final String ACTION_ASSETINFO = "ASSETINFO";
    public static final String ACTION_ASSETINFO_STATUS = "ASSETINFO_STATUS";
    public static final String ACTION_PLAYBACK = "PLAYBACK";
    public static final String ACTION_TRICK_PLAY = "TRICK_PLAY";
    public static final String ACTION_GET_CATCHUP_PROGRAMS = "CATCHUP_PROGRAMS";
    public static final String ACTION_SYNC = "Sync";
    public static final String EXCLUSIVE_DELETED = "DELETED";
    public static final String RESPONSE_ATTRIBUTE_INFO = "info";

    private ConfigReader config = null;
    static final Logger LOGGER = Logger.getLogger(ServerService.class);

    /**
     * @see HttpServlet#HttpServlet()
     */
    public ServerService() {
        super();
        config = ConfigReader.getInstance();

    }

    /**
     * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
     */
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    }

    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws ServletException,
            IOException {
        PrintWriter out = response.getWriter();
        out.print("Delete!!");
    }

    /**
     * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
     */
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException,
            IOException {
        ServiceGet serviceGet = null;
        String subscriberName = null;
        ServiceAssetInfo serviceAssetInfo = null;
        ServiceDelete serviceDeleteRecordings = null;
        ServiceSchedule serviceSchedule = null;
        ServicesSubscriber serviceSubscriber = null;
        ServiceStop serviceStopRecordings = null;
        ServicePlayback servicePlayBack = null;
        NdvrMoxiSynchro sync = null;
        EmsController epgController = null;
        SmsService smsService = null;

        JSONObject responseServer = new JSONObject();
        response.setCharacterEncoding("utf8");
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        try {
            final JSONObject clientMessage = (JSONObject) request.getAttribute("data");
            final String actionService = getValueFromJSON(clientMessage, "actionService");
            switch (actionService) {
                case ACTION_GET:

                    serviceGet = new ServiceGet();
                    serviceGet.setClientMessage(clientMessage);
                    final String exclusive = getValueFromJSON(clientMessage, "exclusive");

                    if (exclusive != null && !exclusive.isEmpty() && EXCLUSIVE_DELETED.equals(exclusive)) {
                        Collection<JSONObject> deletedrecordings = serviceGet.getResponseSubDeletion();
                        responseServer.put(EXCLUSIVE_DELETED, new JSONArray(deletedrecordings));
                        responseServer.put(EXCLUSIVE_DELETED + "Hash", deletedrecordings.toString().hashCode());
                        responseServer.put("responseHeader", serviceGet.getResponseHeader());
                    } else {
                        final String exclude = getValueFromJSON(clientMessage, "exclude");
                        if (!ServiceGet.CATCHUP_TV.equals(exclude)) {

                            JSONObject catchupSets = serviceGet.getResponseMSOInfo();

                            responseServer.put(ServiceGet.CATCHUP_TV, catchupSets);
                            responseServer.put(ServiceGet.CATCHUP_TV + "Hash", catchupSets.hashCode());

                        } else {

                            Collection<JSONObject> recordings = serviceGet.getResponseSubRecordings();
                            responseServer.put("Recordings", new JSONArray(recordings));
                            responseServer.put("RecordingsHash", recordings.toString().hashCode());

                            Collection<JSONObject> schedules = serviceGet.getResponseSubSchedules();
                            responseServer.put("Schedules", new JSONArray(schedules));
                            responseServer.put("SchedulesHash", schedules.toString().hashCode());
                            
                            JSONObject seriesSets = serviceGet.getResponseSeriesInfo();
                            responseServer.put(ServiceGet.SERIES_RECORDING_SET, seriesSets);
                            responseServer.put(ServiceGet.SERIES_RECORDING_SET + "Hash", seriesSets.hashCode());
                            
                            responseServer.put("responseHeader", serviceGet.getResponseHeader());
                        }
                    }
                    break;

                case ACTION_PROGRAM_INFO:
                    serviceAssetInfo = new ServiceAssetInfo(clientMessage);
                    responseServer = serviceAssetInfo.getProgramInfo();
                    break;

                case ACTION_KEEPFOREVER:
                    serviceSchedule = new ServiceSchedule(clientMessage);
                    responseServer = serviceSchedule.sendKeepForEver();
                    break;

                case ACTION_PREFERENCES:
                    serviceSubscriber = new ServicesSubscriber(clientMessage);
                    responseServer = serviceSubscriber.getSubscriberPreferences();
                    break;

                case ACTION_KEEP_ALIVE:
                    servicePlayBack = new ServicePlayback(clientMessage);
                    responseServer.put(RESPONSE_ATTRIBUTE_INFO, servicePlayBack.sendKeepAlive());
                    break;

                case ACTION_SAVE_SUB_PREFERENCES:
                    serviceSubscriber = new ServicesSubscriber(clientMessage);
                    responseServer = serviceSubscriber.saveSubscriberPreferences();
                    break;

                case ACTION_REC_PREFERENCES:
                    serviceSchedule = new ServiceSchedule(clientMessage);
                    responseServer = serviceSchedule.changeRecordingOptions();
                    break;
                    
                case ACTION_SERIES_PREFERENCES:
                    serviceSchedule = new ServiceSchedule(clientMessage);
                    responseServer = serviceSchedule.changeSeriesOptions();
                    break;

                case ACTION_SCHEDULE:
                    serviceSchedule = new ServiceSchedule(clientMessage);
                    responseServer = serviceSchedule.scheduleProgram();
                    break;

                case ACTION_SCHEDULE_SERIES:
                    serviceSchedule = new ServiceSchedule(clientMessage);
                    responseServer = serviceSchedule.scheduleSeries();
                    break;

                case ACTION_DELETE:
                    serviceDeleteRecordings = new ServiceDelete(clientMessage);
                    responseServer = serviceDeleteRecordings.deleteRecord();
                    break;

                case ACTION_DELETE_SERIES:
                    serviceDeleteRecordings = new ServiceDelete(clientMessage);
                    responseServer = serviceDeleteRecordings.deleteSeries();
                    break;

                case ACTION_RESTORE:
                    serviceDeleteRecordings = new ServiceDelete(clientMessage);
                    responseServer = serviceDeleteRecordings.restoreRecord();
                    break;

                case ACTION_CANCEL_SERIES:
                    serviceStopRecordings = new ServiceStop(clientMessage);
                    responseServer = serviceStopRecordings.cancelSeries();
                    break;

                case ACTION_STOP:
                    serviceStopRecordings = new ServiceStop(clientMessage);
                    responseServer = serviceStopRecordings.stopRecord();
                    break;

                case ACTION_ASSETINFO_STATUS:
                    serviceAssetInfo = new ServiceAssetInfo(clientMessage);
                    responseServer.put(RESPONSE_ATTRIBUTE_INFO, serviceAssetInfo.getLatestStatus());
                    break;

                case ACTION_PLAYBACK:
                    servicePlayBack = new ServicePlayback(clientMessage);
                    responseServer.put(RESPONSE_ATTRIBUTE_INFO, servicePlayBack.getPlaybackSession());
                    break;
                    
                case ACTION_TRICK_PLAY:
                    servicePlayBack = new ServicePlayback(clientMessage);
                    responseServer.put(RESPONSE_ATTRIBUTE_INFO, servicePlayBack.sendTrickPlayEvent());
                    break;

                case ACTION_GET_CATCHUP_PROGRAMS:
                    serviceGet = new ServiceGet();
                    responseServer.put(RESPONSE_ATTRIBUTE_INFO, serviceGet.getCatchupPrograms(clientMessage));
                    break;

                case ACTION_SYNC:
                    sync = new NdvrMoxiSynchro(config, clientMessage);
                    sync.invokeSyncMethod();
                    responseServer.put("status", "success");
                    break;

                case ACTION_VALIDATE_SUBSCRIBER:
                    smsService = new SmsService();
                    subscriberName = clientMessage.getString("subscriberName");
                    responseServer.put("subscriber", smsService.validateSubscriber(subscriberName));
                    break;
                    
                case ACTION_CREATE_NEW_USER:
                    smsService = new SmsService();
                    smsService.setClientMessage(clientMessage);
                    responseServer = smsService.createUser();
                    break;
                    
                case ACTION_GET_USERS:
                    smsService = new SmsService();
                    smsService.setClientMessage(clientMessage);
                    responseServer = smsService.getUsers();
                    break;
                
                case ACTION_DELETE_USER:
                    smsService = new SmsService();
                    smsService.setClientMessage(clientMessage);
                    responseServer = smsService.deleteUser();
                    break;
                    
                case ACTION_GUIDE_CHANNEL_DATA:
                    epgController = new EmsController();
                    responseServer.put("channels",
                    epgController.getChannelList(clientMessage.getString("subscriberName")));
                    break;

                case ACTION_GUIDE_PROGRAM_DATA:
                	EmsService ems = new EmsService();
                	//ems.getPrgramsFromRTV();
                    getInitProgramGuide(clientMessage, responseServer);
                    break;

                case ACTION_GUIDE_LAZY_LOAD:
                    if (config.isEpgReady()) {
                        long start = Long.parseLong(getValueFromJSON(clientMessage, "start"));
                        long end = Long.parseLong(getValueFromJSON(clientMessage, "end"));
                        Calendar cStart = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
                        Calendar cEnd = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
                        cStart.setTimeInMillis(start);
                        start = cStart.getTimeInMillis();
                        cEnd.setTimeInMillis(end);
                        end = cEnd.getTimeInMillis();
                        boolean emsMock = false;
                        if(!emsMock){
                            final String channelList = getValueFromJSON(clientMessage, "channelList");
                            epgController = new EmsController();
                            Collection<JSONObject> epgGuideData = epgController.getProgramGuide(channelList, start, end);
                            responseServer.put("epgGuide", epgGuideData);
                        }else{
                        	JSONObject emsMockJson = config.readJsonMock("emsMock.json");
                        	JSONArray epgGuideData = emsMockJson.getJSONArray("data");
                        	responseServer.put("epgGuide", epgGuideData);
                        }

                        responseServer.put("start", start / 1000);
                        responseServer.put("end", end / 1000);
                    } else {
                        responseServer.put("ERROR", "EPG is not ready");
                    }
                    break;

                default:
                    break;
            }
            out.print(responseServer);
            MDC.put("correlationId", "internal");
        } catch (JSONException e) {
            LOGGER.error("ERROR: " + e.getMessage());
        } catch (Exception e) {
            LOGGER.error("ERROR: " + e.getMessage());
        }
    }

    private String getValueFromJSON(final JSONObject json, final String key) {
        String value = null;
        if (json != null && json.has(key)) {
            try {
                value = json.getString(key);
            } catch (JSONException e) {
                LOGGER.error("ERROR: " + e.getMessage());
            }

        }
        return value;
    }

    private void getInitProgramGuide(JSONObject clientMessage, JSONObject responseServer) throws JSONException {
    	EmsController epgController = new EmsController();

    	Calendar cStart = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
    	Calendar cEnd = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
    	cStart.add(Calendar.HOUR_OF_DAY, -12);
    	long start = cStart.getTimeInMillis();
    	cEnd.add(Calendar.HOUR, 25);
    	long end = cEnd.getTimeInMillis();

    	String subscriberName = clientMessage.getString("subscriberName");
    	int channelCount = 0;
    	if (config.getEPGChannelToShow() != null && config.getEPGChannelToShow().length() > 0) {
    		channelCount = Integer.parseInt(config.getEPGChannelToShow());
    	}

    	ArrayList<JSONObject> channelListArray = (ArrayList<JSONObject>) epgController.getChannelList(subscriberName);

    	if (channelListArray != null && channelListArray.size() > 0) {
    		int channelArrayCount = channelListArray.size();
    		int channelArray[] = new int [channelArrayCount];
    		int i = 0;
    		for (i = 0; i < channelArrayCount; i++) {
    			try {
    				channelArray[i] = Integer.parseInt(channelListArray.get(i).getString("station_channel_id"));
    			} catch (Exception e) {
    				LOGGER.error("ERROR - filtering channels for creating a program Guide." + e.getMessage());
    			}
    		}
    		Arrays.sort(channelArray);
    		int trunkChannelArray[] = Arrays.copyOfRange(channelArray, 0, channelCount);
    		String channelListEpgGuide = Arrays.toString(trunkChannelArray).replace("[","").replaceAll("]", "");
    		responseServer.put("epgGuide", epgController.getProgramGuide(channelListEpgGuide, start, end));

    	} else {
    		responseServer.put("epgGuide", new ArrayList<JSONObject>());
    	}

    	responseServer.put("start", start / 1000);
    	responseServer.put("end", end / 1000);

    }
}
