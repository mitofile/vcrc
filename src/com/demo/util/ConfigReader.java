package com.demo.util;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * @author Iacono Diego
 */
public class ConfigReader {
	private static final Logger LOGGER = Logger.getLogger(ConfigReader.class);
	private static ConfigReader configReader = null;
	private static String confingUrl = null;
	private JSONObject configData = null;
	private JSONObject configUI = null;
	public final String HTTP_PROTOCOL = "http://";
	private Map<String, String> configsMap;
	private boolean epgReady = true;
	private Map<String, String> environment = System.getenv();
	private static final Charset ENCODING = StandardCharsets.UTF_8;
	private static final String BUILD_INFO_FILE = "/etc/buildInfo.txt";
	private final String app_version;

	/**
	 * Constructor
	 */
	private ConfigReader() {
		configData = readJsonConfig(confingUrl);
		configsMap = loadConfigMap();
		app_version = getVersionInfo();
	}

	public Map<String, String> getConfigsMap() {
		return configsMap;
	}

	/**
	 * @return
	 */
	public static ConfigReader getInstance() {
		if (configReader == null) {
			confingUrl = System.getenv("configurl");
			if (confingUrl == null || confingUrl.length() == 0) {
				try {
					confingUrl = URLDecoder.decode(ConfigReader.class.getClassLoader().getResource("config.json").getPath(), "UTF-8");
				} catch (UnsupportedEncodingException e) {
					e.printStackTrace();
				}
			}

			configReader = new ConfigReader();
		}
		return configReader;
	}

	private Map<String, String> loadConfigMap() {
		Map<String, String> map = new HashMap<String, String>();
		String[] properties = JSONObject.getNames(configData);
		for (String prop : properties) {
			try {
				if (!prop.startsWith("_help")) {
					replaceWithEnvVariableInfo(prop);
					map.put(prop, configData.getString(prop));
				}
			} catch (JSONException e) {
				e.printStackTrace();
			}
		}
		return map;
	}

	/**
	 * This method replace the config properties based on Environment variables.
	 * if the env variable doesn't exist will use the property defined into the
	 * config.json
	 * 
	 * @param envVariableName
	 */
	private void replaceWithEnvVariableInfo(String envVariableName) {
		String value = environment.get(envVariableName);
		if (value != null && value.trim().length() > 0) {
			updateProperty(envVariableName, value);
		}
	}

	/**
	 * This method is used to replace the default values if a environment exists
	 * with the same name.
	 * 
	 * @param propertyName
	 * @param value
	 */
	private void updateProperty(String propertyName, String value) {
		try {
			configData.put(propertyName, value);
			System.out.println("The property: " + propertyName + " was replaced for envVariable's content with: " + value);
		} catch (JSONException e) {
			System.out.println("ERROR - updating property. it will use default value of Config.json. Caused by: " + e.getMessage());
		}
	}

	/**
	 * @param url
	 * @return
	 */
	private JSONObject readJsonConfig(String url) {
		JSONObject jsonConfig = null;
		try (BufferedReader br = new BufferedReader(new FileReader(url))) {
			StringBuilder sb = new StringBuilder();
			String line = br.readLine();

			while (line != null) {
				sb.append(line);
				sb.append(System.lineSeparator());
				line = br.readLine();
			}
			String fileData = sb.toString();
			jsonConfig = new JSONObject(fileData);

		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		} catch (JSONException e) {
			e.printStackTrace();
		}
		return jsonConfig;
	}

	private String getVersionInfo() {
		String version = "";
		List<String> lines;
		Path path = Paths.get(BUILD_INFO_FILE);
		try {
			lines = Files.readAllLines(path, ENCODING);
			if (lines != null) {
				for (String line : lines) {
					if (line.indexOf("build=") >= 0) {
						version = line.split("=")[1];
					}
				}
			}
		} catch (IOException e) {
			LOGGER.error("ERROR: Build info file not found - " + e.getMessage());
		}
		return version;
	}

	/**
	 * @return * @throws JSONException
	 */
	public boolean isPosterAvailable() {
		try {
			return Boolean.parseBoolean(configData.getString("posterAvailable"));
		} catch (JSONException e) {
			return false;
		}
	}

	/**
	 * @return
	 */
	public String getNdvrTimeout() {
		try {
			return configData.getString("ndvrTimeout");
		} catch (JSONException e) {
			return "4000";
		}
	}

	/**
	 * @return
	 */
	public String getPosterNotAvailableUrl() {
		try {
			return configData.getString("posterNotAvailable");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getCSIpPort() {
		try {
			return configData.getString("CS_PORT_25100_TCP_ADDR") + ":" + configData.getString("CS_PORT_25100_TCP_PORT");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getFMIpPort() {
		try {
			return configData.getString("FM_PORT_25110_TCP_ADDR") + ":" + configData.getString("FM_PORT_25110_TCP_PORT");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getEmsIpPort() {
		try {
			return configData.getString("EMS_PORT_25141_TCP_ADDR") + ":" + configData.getString("EMS_PORT_25141_TCP_PORT");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getSmsIpPort() {
		try {
			return configData.getString("SMS_PORT_25130_TCP_ADDR") + ":" + configData.getString("SMS_PORT_25130_TCP_PORT");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getPlayableIp() {
		try {
			return configData.getString("playableIp");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getCisChannelEndpoint() {
		try {
			return configData.getString("cisChannelEndpoint");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public int getStoreImagesDaysFromToday() {
		try {
			return Integer.parseInt(configData.getString("storeImagesDaysFromToday"));
		} catch (JSONException | NumberFormatException ex) {
			return 1;
		}
	}

	/**
	 * @return
	 */
	public String getPosterFolderPath() {
		try {
			return configData.getString("posterFolderPath");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getChannelIconFolderPath() {
		try {
			return configData.getString("channelIconFolderPath");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getMonitorFilesPath() {
		try {
			return configData.getString("monitorFilesPath");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getCronSchedule() {
		try {
			return configData.getString("cronSchedule");
		} catch (JSONException | NumberFormatException ex) {
			return "0 0 4 * * ?";
		}
	}

	/**
	 * @return
	 */
	public String getCronEPGDownload() {
		try {
			return configData.getString("cronEPGDownload");
		} catch (JSONException | NumberFormatException ex) {
			return "0 0 5 * * ?";
		}
	}

	/**
	 * @return
	 */
	public String getCronCatchupTV() {
		try {
			return configData.getString("cronCatchupTV");
		} catch (JSONException | NumberFormatException ex) {
			return "0 0/10 * 1/1 * ? *";
		}
	}

	/**
	 * @return
	 */
	public boolean getCronJobAllowed() {

		try {
			return Boolean.parseBoolean(configData.getString("cronJobAllowed"));
		} catch (JSONException e) {
			return false;
		}
	}

	/**
	 * @return
	 */
	public String getCronStatusFile() {
		try {
			return configData.getString("cronStatusFile");
		} catch (JSONException | NumberFormatException ex) {
			return "/";
		}
	}

	/**
	 * @return
	 */
	public String getNdvrRecordEndpoint() {
		try {
			return configData.getString("ndvrRecordEndpoint");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getNDVRrecordingSets() {
		try {
			return configData.getString("ndvrRecordingSets");
		} catch (JSONException e) {
			return null;
		}
	}
	
	
	/**
	 * @return
	 */
	public String getFullfilmentCatchup() {
		try {
			return configData.getString("fullfilmentCatchup");
		} catch (JSONException e) {
			return null;
		}
	}
	
	/**
	 * @return
	 */
	public String getFullfilmentEndPoint() {
		try {
			return configData.getString("fullfilmentEndPoint");
		} catch (JSONException e) {
			return null;
		}
	}
	
	/**
	 * @return
	 */
	public String getFullfilmentKeepAliveCatchup() {
		try {
			return configData.getString("fullfilmentKeepAliveCatchup");
		} catch (JSONException e) {
			return null;
		}
	}
	
	
	/**
	 * @return
	 */
	public String getFullfilmentKeepAlive() {
		try {
			return configData.getString("fullfilmentKeepAlive");
		} catch (JSONException e) {
			return null;
		}
	}

	
	/**
	 * @return
	 */
	public String getFullfilmentEvent() {
		try {
			return configData.getString("fullfilmentEvent");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getNDVRStateService() {
		try {
			return configData.getString("NDVRStateService");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getNDVRScheduleService() {
		try {
			return configData.getString("NDVRScheduleService");
		} catch (JSONException e) {
			return null;
		}
	}
	
	/**
	 * @return
	 */
	public String getNDVRScheduleSeries() {
		try {
			return configData.getString("NDVRScheduleSeries");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getNDVRStatusSeries() {
		try {
			return configData.getString("NDVRStatusSeries");
		} catch (JSONException e) {
			return null;
		}
	}
	
	/**
	 * @return
	 */
	public String getNDVRSeriesOptions() {
		try {
			return configData.getString("NDVRSeriesOptions");
		} catch (JSONException e) {
			return null;
		}
	}
	
	
	/**
	 * @return
	 */
	public String getNDVRRecPreferencesService() {
		try {
			return configData.getString("NDVRRecPreferencesService");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getNDVRPreferencesService() {
		try {
			return configData.getString("NDVRPreferencesService");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getMobileQaServerPoster() {
		try {
			return configData.getString("mobileQaServerPoster");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getMobileQaServerChannelIcon() {
		try {
			return configData.getString("mobileQaServerChannelIcon");
		} catch (JSONException e) {
			return null;
		}
	}

	public String getProjectPath() {
		String path = ConfigReader.class.getClassLoader().getResource("config.json").getPath();
		String[] pathArray = path.split("/WEB-INF");
		path = pathArray[0];
		return path;
	}

	/**
	 * @return
	 */
	public String getEPGTimeWindowsHours() {
		try {
			return configData.getString("EPGTimeWindowsHours");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getEPGChannelToShow() {
		try {
			return configData.getString("EPGChannelToShow");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getSubscriberService() {
		try {
			return configData.getString("NDVRGetSubscriber");
		} catch (JSONException e) {
			return null;
		}
	}
	
	/**
	 * @return
	 */
	public String getNDVRUserService() {
		try {
			return configData.getString("NDVRUserService");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getChannelPackageService() {
		try {
			return configData.getString("NDVRGetChannelPackage");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getEpgEventsEndpointPath() {
		try {
			return configData.getString("NDVRGetEpgEvents");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getEpgEventsDefaultQuery() {
		try {
			return configData.getString("NDVRGetEpgDefaultQuery");
		} catch (JSONException e) {
			return null;
		}
	}

	/**
	 * @return
	 */
	public String getEpgProgramMetadata() {
		try {
			return configData.getString("NDVRGetEpgProgramMetadata");
		} catch (JSONException e) {
			return null;
		}
	}

	public String getEPGurl() {
		try {
			return configData.getString("urlEPG");
		} catch (JSONException e) {
			return "";
		}
	}

	public String getAppVersion() {
		return app_version;
	}
	
	public String getIPTVChannelMap() {
		try {
			return configData.getString("iptvChannelMap");
		} catch (JSONException e) {
			return "lisle";
		}
	}

	public String getEmsPreferredLanguage() {
		try {
			return configData.getString("ems_preferred_language");
		} catch (JSONException e) {
			return "";
		}
	}

	public JSONObject readJsonMock(String jsonMockName) {
		String pathFile = confingUrl;
		pathFile = pathFile.replace("config.json", "com/demo/dataMock/" + jsonMockName);
		return readJsonConfig(pathFile);
	}

	public JSONObject readMock(String jsonMockName) {
		String pathFile = ConfigReader.class.getClassLoader().getResource(jsonMockName).getPath();
		return readJsonConfig(pathFile);
	}

	public String getJsonMockPath(String jsonMockName) {
		String pathFile = confingUrl;
		pathFile = pathFile.replace("config.json", "com/demo/dataMock/" + jsonMockName);
		return pathFile;
	}

	public JSONObject readJson(String jsonName) {
		String pathFile = confingUrl;
		pathFile = pathFile.replace("config.json", jsonName);
		return readJsonConfig(pathFile);
	}
	
	public String getJsonPath(String jsonName) {
		String pathFile = confingUrl;
		pathFile = pathFile.replace("config.json", jsonName);
		return pathFile;
	}

	public JSONObject readConfigUiJson() {
		if (configUI == null) {
			String pathFile;
			try {
				pathFile = URLDecoder.decode(ConfigReader.class.getClassLoader().getResource("config.json").getPath(), "UTF-8");
				int projectNameIndex = pathFile.indexOf("WEB-INF");
				pathFile = pathFile.substring(0, projectNameIndex) + "config/" + "getRecordingRequest.json";
				configUI = readJsonConfig(pathFile);
			} catch (UnsupportedEncodingException e) {
				e.printStackTrace();
			}
		}
		return configUI;
	}

	public boolean isEpgReady() {
		return epgReady;
	}

	public void setEpgReady(boolean epgReady) {
		this.epgReady = epgReady;
	}

}
