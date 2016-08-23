package com.demo.service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.demo.epg.model.Program;
import com.demo.util.ConfigReader;
import com.demo.util.RestClient;

public class EmsService extends Service {

	private static final Logger LOGGER = Logger.getLogger(EmsService.class);
	private ConfigReader config;
	private final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
	// private static final String GET_PROGRAMS_ENDPOINT =
	// "/ems/v1/events?stationId={stationId}&query=startTime;lt;{endTime}%2Band%2BendTime;gt;{startTime}&expand=full";
	// private static final String GET_PROGRAM_METADATA_ENDPOINT =
	// "/ems/v1/programs/{programId}";

	// private final JSONObject TV_RATING_CONFIG;

	// PROGRAM FIELDS
	private static final String FIELD_ID = "id";
	private static final String FIELD_TITLES = "title";
	private static final String FIELD_DESCRIPTION = "description"; // optional
	private static final String FIELD_PROGRAM_TYPE = "programType"; // optional
	private static final String FIELD_SERIES_ID = "seriesId"; // optional
	private static final String FIELD_SEASON_ID = "seasonId"; // optional
	private static final String FIELD_SEASON_NUMBER = "seasonNumber"; // optional
	private static final String FIELD_EPISODE_TITLE = "episodeTitle"; // optional
	private static final String FIELD_EPISODE_NUMBER = "episodeNumber"; // optional
	private static final String FIELD_RATINGS = "ratings"; // optional
	private static final String FIELD_ADVISORIES = "advisories"; // optional
	private static final String FIELD_GENRES = "genres"; // optional
	private static final String FIELD_ORIGINAL_AIR_DATE = "originalAirDate"; // optional
	private static final String FIELD_POPULARITY_RATINGS = "popularityRatings"; // optional
	private static final String FIELD_CREW = "crew"; // optional
	private static final String FIELD_CAST = "cast"; // optional
	private static final String FIELD_QUALIFIERS = "qualifiers"; // optional

	// EVENT FIELDS
	private static final String FIELD_EVN_ID = "id";
	private static final String FIELD_EVN_START_TIME = "startTime";
	private static final String FIELD_EVN_END_TIME = "endTime";
	private static final String FIELD_EVN_STATION_ID = "stationId";
	private static final String FIELD_EVN_PROGRAM_REF = "program";
	private static final String FIELD_EVN_ARRAY_ELEMENT = "data";
	private static final String FIELD_EVN_RATINGS = "ratings"; // optional
	private static final String FIELD_EVN_RESTRICTIONS = "restrictions"; // optional

	private String preferedLanguage;

	public EmsService() {
		this.sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
		this.config = ConfigReader.getInstance();
		preferedLanguage = config.getEmsPreferredLanguage();
		// this.TV_RATING_CONFIG = getTvRaitingConfig();
	}

	public Program getProgramMetadata(String programId) {
		Program programInfo = null;
		String baseUrl = this.getBaseEmsUrl();
		String url = baseUrl + config.getEpgProgramMetadata().replace("{programId}", programId);
		try {
			JSONObject response = sendRequest(url, RestClient.METHOD_GET);
			programInfo = new Program();
			return parseProgram(response, programInfo);
		} catch (JSONException ex) {
			LOGGER.error("Error parsing program from EMS: " + ex.getMessage());
		} catch (Exception e) {
			LOGGER.error("Error sending request to EMS: " + e.getMessage());
		}
		return programInfo;
	}
	

	public List<Program> getProgramGuide(String channelList, long start, long end) {
		String baseurl = this.getBaseEmsUrl() + config.getEpgEventsEndpointPath();
		String url = baseurl + config.getEpgEventsDefaultQuery().replace("{start}", sdf.format(new Date(start)));
		url = url.replace("{end}", sdf.format(new Date(end)));

		List<Program> programs = new ArrayList<Program>();
		try {
			String[] channels = channelList.split(",");
			getProgramByChannels(url, channels, programs);
		} catch (JSONException ex) {
			LOGGER.error("Error parsing event from EMS: " + ex.getMessage());
		} catch (Exception e) {
			LOGGER.error("Error sending request to EMS: " + e.getMessage());
		}
		return programs;
	}

	// ////////////////////// | private methods | \\\\\\\\\\\\\\\\\\\\\\\\\\\\

	private void getProgramByChannels(String url, String[] channels, List<Program> programs) throws Exception{
		for (String channel : channels) {
			channel = (channel!=null)?channel.trim():"0";
			if(!channel.equals("0")){
				String urlStation = url.replace("{station}", channel.trim());
				JSONObject response = null;
				int programCount = 0;
				do{
					response = sendRequest(urlStation, RestClient.METHOD_GET);
					JSONArray data = response.getJSONArray(FIELD_EVN_ARRAY_ELEMENT);
					addPrograms(data, programs);
					programCount = programs.size() + programCount;
					urlStation = response.optString("nextPage", null);
					//comment out this lines if you wants to replace internal EMS dns name
//					urlStation = urlStation.replace("ems-query", "controller.qa.ndvrlabs.com:25141");
				}while(urlStation!=null && urlStation.trim().length()>0);
				LOGGER.info("Pograms retrieve for channel " + channel +" -> " + programCount);
		    }
		}
	}
	
	private void addPrograms(JSONArray data, List<Program> programs) throws JSONException, ParseException{
		JSONObject event;
		Program p;
		for (int i = 0; i < data.length(); i++) {
			event = data.getJSONObject(i);
			p = new Program();

			// set mandatory attributes
			p.setAiringId(event.getString(FIELD_EVN_ID));

			// set optional attributes
			
			p.setAir_date(convertDateTimeFormat(event.optString(FIELD_EVN_START_TIME)));
			p.setEnd_date(convertDateTimeFormat(event.optString(FIELD_EVN_END_TIME)));
			p.setStationId(event.optString(FIELD_EVN_STATION_ID));
			p.setStationChannel(event.optString(FIELD_EVN_STATION_ID));
			JSONArray tvRatingsArray = event.optJSONArray(FIELD_EVN_RATINGS);
			// if (tvRatingsArray != null && tvRatingsArray.length() >
			// 0) {
			// p.setTvRating(tvRatingsArray.getString(0));
			// } else {
			p.setTvRating("5"); // PG
			// }

			// add program metadata to program object
			this.parseProgram(event.getJSONObject(FIELD_EVN_PROGRAM_REF), p);
			programs.add(p);
		}
		
	}
	
	private String convertDateTimeFormat(String dateStr) throws ParseException {
		SimpleDateFormat sdf = getParseFormat(dateStr);
		Date date = sdf.parse(dateStr);
		Calendar c = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
		c.setTime(date);
		long time = c.getTimeInMillis() / 1000;

		return ((Long) time).toString();
	}
	
	private SimpleDateFormat getParseFormat(String dateStr){
		SimpleDateFormat sdf = null;
		if(dateStr.indexOf(".")>0){
			sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
		}else{
			sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
		}
		sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
		return sdf;
	}

	private Program parseProgram(JSONObject programJson, Program program) throws JSONException {

		// The following properties are not present in programJson
		program.setId(0);
		program.setRecommendationId("not-provided");
		program.setYear("not-provided");
		program.setDuration("0");

		// programJson has some attributes that are not present in Program
		// class:
		// FIELD_PROGRAM_TYPE
		// FIELD_SEASON_ID
		// FIELD_ADVISORIES
		// FIELD_QUALIFIERS

		// set mandatory attributes
		program.setProgramId(programJson.getString(FIELD_ID));
		program.setTitle(getTitleFromJson(programJson.getJSONObject(FIELD_TITLES)));

		// set optional attributes
		program.setDescription(getDecriptionFromJson(programJson.optJSONObject(FIELD_DESCRIPTION)));
		program.setAltSeries(programJson.optString(FIELD_SERIES_ID));
		program.setSeasonNumber(programJson.optString(FIELD_SEASON_NUMBER));
		program.setEpisodeTitle(getTitleFromJson(programJson.optJSONObject(FIELD_EPISODE_TITLE)));
		program.setEpisodeNumber(programJson.optString(FIELD_EPISODE_NUMBER));

		String raiting = getRatings(programJson.optJSONArray(FIELD_RATINGS));
		program.setRating(raiting);
		// program.setTvRating("not-provided");
		// TV_RATING_CONFIG.get

		program.setGenre(getGeneres(programJson.optJSONArray(FIELD_GENRES)));
		program.setOriginalAirDate(programJson.optString(FIELD_ORIGINAL_AIR_DATE));
		program.setStartRatring(getPopularityRatings(programJson.optJSONArray(FIELD_POPULARITY_RATINGS)));
		program.setProducer(getProducer(programJson.optJSONArray(FIELD_CREW)));
		program.setCast(getCast(programJson.optJSONArray(FIELD_CAST)));

		return program;
	}

	private String[] getCast(JSONArray jsonArray) {
		List<String> cast = new ArrayList<String>();
		if (jsonArray != null) {
			JSONObject castAndCrewMember;
			for (int i = 0; i < jsonArray.length(); i++) {
				try {
					castAndCrewMember = jsonArray.getJSONObject(i);
					String role = castAndCrewMember.getString("role");
					String firstName = castAndCrewMember.getString("firstName");
					String lastName = castAndCrewMember.getString("lastName");
					cast.add(firstName + " " + lastName + " (" + role + ")");
				} catch (JSONException e) {
					LOGGER.error("Error parsing program cast from EMS: " + e.getMessage());
				}
			}
		}
		return cast.toArray(new String[0]);
	}

	private String[] getProducer(JSONArray jsonArray) {
		List<String> producers = new ArrayList<String>();
		if (jsonArray != null) {
			JSONObject castAndCrewMember;
			for (int i = 0; i < jsonArray.length(); i++) {
				try {
					castAndCrewMember = jsonArray.getJSONObject(i);
					String role = castAndCrewMember.getString("role");
					String firstName = castAndCrewMember.getString("firstName");
					String lastName = castAndCrewMember.getString("lastName");
					if (role.toUpperCase().indexOf("PRODUCER") != -1) {
						producers.add(firstName + " " + lastName + " (" + role + ")");
					}
				} catch (JSONException e) {
					LOGGER.error("Error parsing program producer from EMS: " + e.getMessage());
				}
			}
		}
		return producers.toArray(new String[0]);
	}

	private String getPopularityRatings(JSONArray jsonArray) {
		String raitings = "";
		if (jsonArray != null) {
			if (jsonArray.length() > 0) {
				try {
					raitings = jsonArray.getJSONObject(0).getString("value");
				} catch (JSONException e) {
					LOGGER.error("ERROR parsing popularityRatings attribute from EMS: " + e.getMessage());
					return raitings;
				}
			}
		}
		return raitings;
	}

	private String getGeneres(JSONArray jsonArray) {
		String generes = null;
		if (jsonArray != null) {
			if (jsonArray.length() > 0) {
				try {
					generes = jsonArray.getString(0);
				} catch (JSONException e) {
					LOGGER.error("ERROR parsing generes attribute from EMS: " + e.getMessage());
					return generes;
				}
			}
		}
		return generes;
	}

	private String getRatings(JSONArray jsonArray) {
		String rating = null;
		if (jsonArray != null) {
			if (jsonArray.length() > 0) {
				try {
					rating = jsonArray.getJSONObject(0).getString("value");
				} catch (JSONException e) {
					LOGGER.error("ERROR parsing rating attribute from EMS: " + e.getMessage());
					return rating;
				}
			}
		}
		return rating;
	}

	// private String getTvRatings(String raiting) {
	// if (raiting != null) {
	// JSONArray tvRaitings = TV_RATING_CONFIG.getJSONArray("tv_ratings");
	// JSONObject tvRaitingObj;
	// if (tvRaitings != null && tvRaitings.length() > 0) {
	// for (int i = 0; i < tvRaitings.length(); i++) {
	// tvRaitingObj = tvRaitings.getJSONObject(i);
	// try {
	// rating = tvRaitingObj.getString("value");
	// } catch (JSONException e) {
	// LOGGER.error("ERROR parsing rating attribute from EMS: " +
	// e.getMessage());
	// return rating;
	// }
	// }
	// }
	// }
	// return rating;
	// }

	private String getTitleFromJson(JSONObject json) throws JSONException {
		if (json != null) {
			String langs[] = JSONObject.getNames(json);
			if (langs == null || langs.length == 0) {
				LOGGER.error("Program title not found");
				throw new JSONException("Program title not found");
			} else {
				try {
					for (String lang : langs) {
						if (lang.equalsIgnoreCase(preferedLanguage)) {
							return json.getString(lang);
						}
					}
					return json.getString(langs[0]);
				} catch (JSONException e) {
					LOGGER.error("Program title not found");
					throw e;
				}
			}
		}
		return null;
	}

	private String getDecriptionFromJson(JSONObject json) throws JSONException {
		if (json != null) {
			String langs[] = JSONObject.getNames(json);
			if (langs == null || langs.length == 0) {
				LOGGER.error("Program title not found");
				throw new JSONException("Program title not found");
			} else {
				try {
					for (String lang : langs) {
						if (lang.equalsIgnoreCase(preferedLanguage)) {
							return json.getString(lang);
						}
					}
					return json.getString(langs[0]);
				} catch (JSONException e) {
					LOGGER.error("Program title not found");
					throw e;
				}
			}
		}
		return null;
	}
	
	
	public void getPrgramsFromRTV(){
		String url = "https://www.reportv.com.ar/finder/grid";
		JSONObject payload = new JSONObject();
		//{ idAlineacion : IDALINEACION, fecha: FECHA, hora: HORA, idCategoria: idCategoria}
		try {
			payload.put("idAlineacion", "2680");
			payload.put("fecha", "2016-03-08");
			payload.put("hora", "18:00");
			payload.put("idCategoria", "4");
			System.setProperty("jsse.enableSNIExtension", "false");
			RestClient restClient = new RestClient(RestClient.METHOD_POST, "idAlineacion=2680&fecha=2016-03-08&hora=13%3A00&idCategoria=4");
			restClient.sendRequest(url, true);
		    System.out.println(restClient.getResponseResult());
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

	}

	// private JSONObject getTvRaitingConfig() {
	// String url;
	// try {
	// url =
	// URLDecoder.decode(ConfigReader.class.getClassLoader().getResource("tv_rating_mapping.json").getPath(),
	// "UTF-8");
	// JSONObject jsonConfig = null;
	// try (BufferedReader br = new BufferedReader(new FileReader(url))) {
	// StringBuilder sb = new StringBuilder();
	// String line = br.readLine();
	//
	// while (line != null) {
	// sb.append(line);
	// sb.append(System.lineSeparator());
	// line = br.readLine();
	// }
	// String fileData = sb.toString();
	// jsonConfig = new JSONObject(fileData);
	//
	// } catch (FileNotFoundException e) {
	// e.printStackTrace();
	// } catch (IOException e) {
	// e.printStackTrace();
	// } catch (JSONException e) {
	// e.printStackTrace();
	// }
	// return jsonConfig;
	// } catch (UnsupportedEncodingException e1) {
	// e1.printStackTrace();
	// }
	// return null;
	// }
	
/*	public static void main(String args[]){
		EmsService ems = new EmsService();
		String dateStr = "2016-07-28T16:00:00Z";
		String dateStr2 = "2016-07-28T16:00:00.000Z";
		ems.getParseFormat(dateStr);
		try {
			System.out.println(ems.convertDateTimeFormat(dateStr));
			System.out.println(ems.convertDateTimeFormat(dateStr2));
		} catch (ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}*/
}
