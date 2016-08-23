package com.Scheduler;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import org.apache.log4j.Logger;
import org.apache.log4j.MDC;
import org.quartz.InterruptableJob;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.quartz.UnableToInterruptJobException;

import com.demo.util.ConfigReader;
import com.demo.util.FileUtil;
import com.demo.util.RestClient;
/**
 * This Class represent the Job that will be executed cyclically.
 * 
 * @author Iacono Diego
 *
 */
public class ImageCacheJob implements InterruptableJob {
	private List<String> channelListInfo;
	private Set<String> programListInfo;
	private ConfigReader config = ConfigReader.getInstance();
	public static final String EXECUTION_DELAY = "ExecutionDelay";
	static final Logger LOGGER = Logger.getLogger(ImageCacheJob.class);
	public static final String STATUS_JOB_FILE_NAME = "jobStatus.qtz";

	private volatile boolean isJobInterrupted = false;
	private JobKey jobKey = null;
	private volatile Thread thisThread;

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.quartz.Job#execute(org.quartz.JobExecutionContext)
	 */
	@Override
	public void execute(JobExecutionContext arg0) throws JobExecutionException {
		try {
			MDC.put("appVersion", config.getAppVersion());
			MDC.put("correlationId", "internal");
			MDC.put("hostname", "Unknow");
			MDC.put("reqtype", "GET");

			LOGGER.info("JOB - ImageJob - Wakeup.");
			JobDataMap map = arg0.getJobDetail().getJobDataMap();
			long delayLong = 0;
			if (map.containsKey(ImageCacheJob.EXECUTION_DELAY)) {
				delayLong = map.getLong(ImageCacheJob.EXECUTION_DELAY);
				LOGGER.info("ImageJob - " + ImageCacheJob.EXECUTION_DELAY + ": " + delayLong);
			}

			thisThread = Thread.currentThread();
			jobKey = arg0.getJobDetail().getKey();

			try {
				Thread.sleep(delayLong * 60 * 1000L);
			} catch (Exception ignore) {
				LOGGER.info("ERROR executing the delay operation");
			}

			LOGGER.info("ImageJob - Checking if is the first time the job is invoked.");
			boolean runFlag = true;
			String lastRun = FileUtil.readStatus(config.getCronStatusFile() + "/" + STATUS_JOB_FILE_NAME);
			SimpleDateFormat fmt = new SimpleDateFormat(FileUtil.FORMTATED_DAY);
			Date lastRunDay;
			try {
				lastRunDay = fmt.parse(lastRun);
				long hours = QuartzJobListener.hoursBetweenDay(lastRunDay);
				runFlag = hours >= 24;
				LOGGER.info("Last day Run: " + lastRunDay + ", Current Time: " + fmt.format(new Date()) + " - Hour Diff = " + hours);
				LOGGER.info("Job will run -> " + runFlag);
			} catch (ParseException e) {
				LOGGER.error("ERROR - no valid day found: " + e.getMessage());
			}

			if (runFlag) {
				try {
					FileUtil.writeStatus(config.getCronStatusFile() + "/" + STATUS_JOB_FILE_NAME);
					LOGGER.info("File updated: " + config.getCronStatusFile() + "/" + STATUS_JOB_FILE_NAME);
				} catch (IOException e) {
					LOGGER.error("ImageJob -  can't update the " + config.getCronStatusFile() + " with the latest day run");
				}

				LOGGER.info("ImageJob executed:  " + new Date());
				SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
				Calendar calendar = Calendar.getInstance();
				calendar.setTime(new Date()); // Now use today date.
				String startDay = sdf.format(calendar.getTime()) + "T00:00:00.000Z";
				calendar.add(Calendar.DATE, config.getStoreImagesDaysFromToday()); // Adding
																					// n
																					// day
				String endDay = sdf.format(calendar.getTime()) + "T00:00:00.000Z";
				LOGGER.info("Getting Programs from: " + startDay + " to " + endDay);
				programListInfo = getPrograms(startDay, endDay, channelListInfo);

				LOGGER.info("The CronJob will download " + programListInfo.size() + " program Posters");
				int posterCountDownloaded = findPosterAndStore();
				LOGGER.info("The CronJob saved " + posterCountDownloaded + " program posters");
				LOGGER.info("The CronJob will download " + channelListInfo.size() + " Channel Icons");
				int channelCountDownloaded = findChannelIconAndStore();
				LOGGER.info("The CronJob save " + channelCountDownloaded + " channel icons");
			}
		} finally {
			LOGGER.info("JOB - ImageJob process - finished.");
		}

	}

	private int findPosterAndStore() {
		int count = 0;
		final String extensionFile = ".jpg";
		String path = config.getPosterFolderPath();
		String url = config.getMobileQaServerPoster();
		String resultUrl = null;
		String posterUrl = null;
		for (String programId : programListInfo) {
			resultUrl = url;
			posterUrl = resultUrl.replace("{programId}", programId);
			try {
				FileUtil.saveImage(posterUrl, path, programId + extensionFile);
				FileUtil.saveImage(posterUrl, config.getProjectPath() + "/posterImage", programId + extensionFile);
				count++;
			} catch (IOException e) {
				LOGGER.error("Error could not find: " + e.getMessage());
			}
		}
		return count;
	}

	private int findChannelIconAndStore() {
		int count = 0;
		final String extensionFile = ".png";
		String path = config.getChannelIconFolderPath();
		String url = config.getMobileQaServerChannelIcon();
		String resultUrl = null;
		String posterUrl = null;
		for (String channelId : channelListInfo) {
			resultUrl = url;
			posterUrl = resultUrl.replace("{stationId}", channelId);
			try {
				FileUtil.saveImage(posterUrl, path, channelId + extensionFile);
				FileUtil.saveImage(posterUrl, config.getProjectPath() + "/channelLogo", channelId + extensionFile);
				count++;
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		return count;
	}

	/**
	 * @return
	 */
	private ArrayList<String> getListOfChannels() {
		LOGGER.info("Getting list of channels.");
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
			for (String token : tokens) {
				if (token.matches("-?\\d+(\\.\\d+)?")) {
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
	private TreeSet<String> getPrograms(String startDay, String endDay, List<String> channelIdList) {
		LOGGER.info("Getting list of programs");
		TreeSet<String> programListResult = new TreeSet<String>();
		//Soap soapClient = new Soap();
		String url = "";//config.HTTP_PROTOCOL + config.getCISIpPort() + config.getCisEPGEndpoint();
		LOGGER.info("Epg request to url: " + url);
		String resultRequest = null;
		for (String channelId : channelIdList) {
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
				LOGGER.info("CIS - Getting Programs ERROR: " + e.getMessage());
				break;
			}

		}
		return programListResult;
	}

	private String request = "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:cis=\"http://www.scte.org/schemas/130-4/2008a/cis\" xmlns:core=\"http://www.scte.org/schemas/130-2/2008a/core\"> <soapenv:Header/> <soapenv:Body> <ns3:ContentQueryRequestType messageId=\"1\" version=\"1.1\" identity=\"40DA910E-01AF-5050-C7EA-5D7B4A475311\" system=\"sys-1\" xmlns:ns2=\"http://www.scte.org/schemas/130-4/2008a/cis\" xmlns=\"http://www.scte.org/schemas/130-2/2008a/core\" xmlns:ns3=\"ContentQueryRequestType\"> <ns2:ContentQuery contentQueryId=\"1\" expandOutput=\"true\"> <ContentDataModel type=\"ADI11Merch\"/> <ns2:QueryFilter op=\"include\"> <ns2:AdvancedFilterElement queryId=\"queryId\" ql=\"solr\">channel_id:{channelId}</ns2:AdvancedFilterElement> <ns2:AdvancedFilterElement queryId=\"queryId\" ql=\"solr\">start_time:[\"{startDay}\" TO \"{endDay}\"]</ns2:AdvancedFilterElement> </ns2:QueryFilter> </ns2:ContentQuery> </ns3:ContentQueryRequestType> </soapenv:Body> </soapenv:Envelope>";

	@Override
	public void interrupt() throws UnableToInterruptJobException {
		LOGGER.error("calling interrupt:" + thisThread + "==>" + jobKey);
		setJobInterrupted(true);
		if (thisThread != null) {
			thisThread.interrupt();
		}
	}

	public boolean isJobInterrupted() {
		return isJobInterrupted;
	}

	public void setJobInterrupted(boolean isJobInterrupted) {
		this.isJobInterrupted = isJobInterrupted;
	}

}
