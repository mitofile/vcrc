package com.demo.util;

import java.io.File;
import java.io.IOException;
import java.net.*;
import java.text.SimpleDateFormat;
import java.util.*;

import org.json.*;

import com.demo.service.ServiceGet;

public class PosterDownloadTool {
	private ArrayList<String> channelListInfo;
	private TreeSet<String> programListInfo;
	private ConfigReader config = ConfigReader.getInstance();
	private int countV2 = 0;
	private int countV5 = 0;
	private int countDownload = 0;
	private int countExists = 0;
	private String cachePath;
	private String projetPath;
	private String subscriber;
	private boolean testDownload;
	private boolean forceCatchupPoster;
	private boolean forceSubscriberPoster;
	

	
	public void executeTool() {
		if (forceCatchupPoster) {
//			getCatchupPosters();
		} else if (forceSubscriberPoster) {
			getSubscriberPoster(subscriber);
		} else {
			findAndSavePosters();
		}
	}
	
	private void getSubscriberPoster(String subscriber){
		try {
			
			Collection<JSONObject> response = new ArrayList<JSONObject>();
			JSONObject jsonObj = new JSONObject("{\"RecordingsSchedules\": {\"subscriber\": \"" + subscriber + "\",\"recordingFilter\" : \"COMPLETED|CAPTURING\"}}");
			//ServiceGet serviceGet = new ServiceGet(jsonObj);
			//Collection<JSONObject> response1 = serviceGet.getResponseSubRecordings();
			
			jsonObj = new JSONObject("{\"RecordingsSchedules\": {\"subscriber\": \"" + subscriber + "\",\"scheduleFilter\" : \"SCHEDULED|RECEIVED\"}}");
			//serviceGet = new ServiceGet(jsonObj);
			//Collection<JSONObject> response2 = serviceGet.getResponseSubSchedules();
			
//			if(response1!=null && response1.size()>1){
//				System.out.println("Recordings for subscriber " + subscriber + " total " +  response1.size());
//				response.addAll(response1);
//			}
//			if(response2!=null && response2.size()>1){
//				System.out.println("Schedules for subscriber " + subscriber + " total " +  response1.size());
//				response.addAll(response2);
//			}
			getPosters(response);
		} catch (JSONException e) {
			System.out.println("ERROR - " + e.getMessage());
		}
	}
	
	
	private void getCatchupPosters(){
		try {
			JSONObject jsonObj = new JSONObject("{\"CATCHUP_TV\": {\"subscriber\": \"ArrisProvider\",\"msoFilter\" : \"COMPLETED|CAPTURING\"}}");
			//ServiceGet serviceGet = new ServiceGet(jsonObj);
			//Collection<JSONObject> catchupResponse = serviceGet.getResponseMSOInfo();
			//getPosters(catchupResponse);
		} catch (JSONException e) {
			System.out.println("ERROR - " + e.getMessage());
		}
	}
	
	
	private void getPosters(Collection<JSONObject> response) {
		programListInfo = new TreeSet<String>();
		for (JSONObject item : response) {
			try {
				programListInfo.add(item.getJSONObject("recording").getJSONObject("program").getString("programId"));
			} catch (JSONException e) {
				System.out.println("ERROR - " + e.getMessage());
			}
		}
		int posterCountDownloaded = findPosterAndStore();
		System.out.println("Poster processed: " + posterCountDownloaded);
	}
	
	private void findAndSavePosters(){
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(new Date()); // Now use today date.
		String startDay = sdf.format(calendar.getTime()) + "T00:00:00.000Z";
		calendar.add(Calendar.DATE, config.getStoreImagesDaysFromToday()); // Adding n day
		String endDay = sdf.format(calendar.getTime()) + "T00:00:00.000Z";
		System.out.println("Getting Programs from: " + startDay + " to " + endDay);
		programListInfo = getPrograms(startDay, endDay, channelListInfo);
		System.out.println("Poster Download Tool will " + (testDownload?"Test ":"Donwload ") + programListInfo.size() + " program Posters");
		int posterCountDownloaded = findPosterAndStore();
		System.out.println("Poster processed: " + posterCountDownloaded);
		if(testDownload){
			System.out.println("Count of poster found on V2 : " + countV2);
			System.out.println("Count of poster found on V5 : " + countV5);
		}
	}
	
	private void isResourceAvailable(String urlString)throws IOException {
	int responseCode = 0;
	String[] arrayVersion = {"v2","v5"};
	for(String version : arrayVersion){
		urlString = urlString.substring(0, urlString.length()-2);
		urlString = urlString + version;
		URL url = new URL(urlString);	
		
		HttpURLConnection.setFollowRedirects(false);
		HttpURLConnection http = (HttpURLConnection) url.openConnection();
		http.setRequestMethod("HEAD");
		http.connect();
		responseCode = http.getResponseCode();
		if(responseCode != 200 ? false : true){
			if(version.equals("v2")){
				countV2++;
			}else{
				countV5++;
			}
		}
	}
	System.out.println("Total V2: " + countV2);
	System.out.println("Total V5: " + countV5);
}
	
	private int findPosterAndStore() {
		int count = 0;
		String url = config.getMobileQaServerPoster();
		int pendingCount = programListInfo.size();
		for(String programId : programListInfo){
			System.out.println("Test poster art for " + programId);
			String posterUrl = url.replace("{programId}", programId);
			try {
				if(!testDownload){
					downloadPoster(posterUrl, programId);
					count++;
				}else{
					isResourceAvailable(posterUrl);
				}
			} catch (IOException e) {
				System.out.println("Error could not find: " + e.getMessage());
			}
			pendingCount--;
			System.out.println("pending " + pendingCount);
		}
		System.out.println("Poster total Count: " + programListInfo.size() + " - 100%");
		double a = (double)(countDownload*100)/(double)programListInfo.size();
		System.out.println("Posters downloaded = " + countDownload + " - " + String.format("%.1f", a) + "%");
		double b = (double)(countExists*100)/(double)programListInfo.size();
		System.out.println("Posters that exists = " + countExists + " - " + String.format("%.1f", b) + "%");
		int notAvailable = programListInfo.size() - countExists - countDownload;
		double c = (double)(notAvailable*100)/(double)programListInfo.size();
		System.out.println("Posters not available = " + notAvailable + " - " + String.format("%.1f", c) + "%");
		return count;
	}
	
	private void downloadPoster(String posterUrl, String programId) throws IOException{
		final String extensionFile = ".jpg";
		File file = new File(cachePath + "/posterImages/" + programId + extensionFile);
		if(file.exists()){
			countExists++;
		}else{
			System.out.println("downloading poster: " + programId + extensionFile);
			FileUtil.saveImage(posterUrl, cachePath + "/posterImages", programId + extensionFile);
			FileUtil.saveImage(posterUrl, projetPath + "/posterImage", programId + extensionFile);	
			if(file.exists()){
				countDownload++;
			}
		}
	}
	
	/**
	 * @return
	 */
	private ArrayList<String> getListOfChannels(){
		System.out.println("Getting list of channels.");
		ArrayList<String> channelList = null;
		RestClient restClient = new RestClient();
		String url = "";//config.HTTP_PROTOCOL + config.getCISIpPort() + config.getCisChannelEndpoint();
		try {
			restClient.sendRequest(url, false);
			String response = restClient.getResponseResult();
			channelList = new ArrayList<String>();
			response = response.replaceAll("\\s+", "");
			response = response.replaceAll("\\t+", "");
			response = response.replaceAll("\\n+", "");
			String channels = response.split("<lstname=\"channel_id\">")[1]; 
			String[] tokens = channels.split("\"");
			for(String token : tokens){
				if(token.matches("-?\\d+(\\.\\d+)?")){
					channelList.add(token);
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return channelList;
	}
	
	/**
	 * @param startDay
	 * @param endDay
	 * @param channelIdList
	 * @return
	 */
	private TreeSet<String> getPrograms(String startDay, String endDay, ArrayList<String> channelIdList) {
		System.out.println("Getting list of programs");
		TreeSet<String> programListResult = new TreeSet<String>();
		String url =  "";//config.HTTP_PROTOCOL + config.getCISIpPort() + config.getCisEPGEndpoint();
		System.out.println("Epg request to url: " + url);
		String resultRequest = null;
		for(String channelId : channelIdList){
			resultRequest = request;
			resultRequest = resultRequest.replace("{startDay}", startDay);
			resultRequest = resultRequest.replace("{endDay}", endDay);
			resultRequest = resultRequest.replace("{channelId}", channelId);
			try {
				//soapClient.sendRequest(resultRequest, url);
				String[] outlines = new String[1];//soapClient.getResponseResult().split("<App");
				for (String outLine : outlines) {
					if (outLine.contains("Name=\"airing_id\" Value=")) {
						String line = outLine.split("\"")[5].split("_")[0];
						programListResult.add(line);
					}
				}
			} catch (Exception e) {
				System.out.println("CIS - Getting Programs ERROR: " + e.getMessage());
				break;
			}
		}
		return programListResult;
	}
	
    private String request = "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:cis=\"http://www.scte.org/schemas/130-4/2008a/cis\" xmlns:core=\"http://www.scte.org/schemas/130-2/2008a/core\"> <soapenv:Header/> <soapenv:Body> <ns3:ContentQueryRequestType messageId=\"1\" version=\"1.1\" identity=\"40DA910E-01AF-5050-C7EA-5D7B4A475311\" system=\"sys-1\" xmlns:ns2=\"http://www.scte.org/schemas/130-4/2008a/cis\" xmlns=\"http://www.scte.org/schemas/130-2/2008a/core\" xmlns:ns3=\"ContentQueryRequestType\"> <ns2:ContentQuery contentQueryId=\"1\" expandOutput=\"true\"> <ContentDataModel type=\"ADI11Merch\"/> <ns2:QueryFilter op=\"include\"> <ns2:AdvancedFilterElement queryId=\"queryId\" ql=\"solr\">channel_id:{channelId}</ns2:AdvancedFilterElement> <ns2:AdvancedFilterElement queryId=\"queryId\" ql=\"solr\">start_time:[\"{startDay}\" TO \"{endDay}\"]</ns2:AdvancedFilterElement> </ns2:QueryFilter> </ns2:ContentQuery> </ns3:ContentQueryRequestType> </soapenv:Body> </soapenv:Envelope>";

	
	public static void main(String[] args) {
		PosterDownloadTool tool = new PosterDownloadTool();
		tool.setSubscriber(args[0]);
		tool.setCachePath(args[1]);
		tool.setProjetPath(args[2]);
		tool.setForceCatchupPoster(Boolean.parseBoolean(args[3]));
		tool.setForceSubscriberPoster(Boolean.parseBoolean(args[4]));
		tool.setTestDownload(false);
		tool.executeTool();
	}
	
//	public static void main(String[] args) {
//		PosterDownloadTool tool = new PosterDownloadTool();
//		tool.setSubscriber("Diego");
//		tool.setCachePath("C:/MoxiCache");
//		tool.setProjetPath("C:/Users/mqj476/workspace2/.metadata/.plugins/org.eclipse.wst.server.core/tmp0/wtpwebapps/vcrc");
//		tool.setForceCatchupPoster(false);
//		tool.setForceSubscriberPoster(false);
//		tool.setTestDownload(false);
//		tool.executeTool();
//	}


	/**
	 * @return the cachePath
	 */
	public String getCachePath() {
		return cachePath;
	}


	/**
	 * @param cachePath the cachePath to set
	 */
	public void setCachePath(String cachePath) {
		this.cachePath = cachePath;
	}


	/**
	 * @return the projetPath
	 */
	public String getProjetPath() {
		return projetPath;
	}


	/**
	 * @param projetPath the projetPath to set
	 */
	public void setProjetPath(String projetPath) {
		this.projetPath = projetPath;
	}


	/**
	 * @return the testDownload
	 */
	public boolean isTestDownload() {
		return testDownload;
	}


	/**
	 * @param testDownload the testDownload to set
	 */
	public void setTestDownload(boolean testDownload) {
		this.testDownload = testDownload;
	}


	/**
	 * @return the forceCatchupPoster
	 */
	public boolean isForceCatchupPoster() {
		return forceCatchupPoster;
	}


	/**
	 * @param forceCatchupPoster the forceCatchupPoster to set
	 */
	public void setForceCatchupPoster(boolean forceCatchupPoster) {
		this.forceCatchupPoster = forceCatchupPoster;
	}
	
	/**
	 * @return the forceSubscriberPoster
	 */
	public boolean isForceSubscriberPoster() {
		return forceSubscriberPoster;
	}


	/**
	 * @param forceSubscriberPoster the forceSubscriberPoster to set
	 */
	public void setForceSubscriberPoster(boolean forceSubscriberPoster) {
		this.forceSubscriberPoster = forceSubscriberPoster;
	}

	public void setSubscriber(String subscriber) {
		this.subscriber = subscriber;
	}

}
