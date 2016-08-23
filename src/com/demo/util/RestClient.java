package com.demo.util;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.log4j.Logger;
import org.apache.log4j.MDC;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * This class represents a Rest Client instance. It retrieves the information
 * through HTTP.
 * 
 * @author Iacono Diego
 *
 */

public class RestClient {
	public static final String METHOD_POST = "POST";
	public static final String METHOD_PUT = "PUT";
	public static final String METHOD_GET = "GET";
	public static final String METHOD_DELETE = "DELETE";
	public static final String EMPTY_PAYLOAD = "{}";
	public static final String TIME_OUT = "timed out";
	public static final String REFUSED = "refused";
	public static final String CUSTOM_INFO_CORRELATION_ID_TAG = "X-Arris-CorrelationId";
	public static final String CUSTOM_INFO_SOURCE_TAG = "X-Arris-Source";
	public static final String QUOTA_HEADER = "X-ARRS-QUOTA-USAGE";
	public static final String SUBSCRIBER_HEADER = "X-ARRIS-Subscriber";
	public static final String SOURCE_NAME = "VCR-C";

	private Map<String, List<String>> reponseHeader = null;
	private ConfigReader config = ConfigReader.getInstance();
	private String method = METHOD_GET;
	private String payload = null;
	private boolean error = false;
	static final Logger LOGGER = Logger.getLogger(RestClient.class);

	private String headerSent = null;
	private String responseResult = null;

	public RestClient() {

	}

	public RestClient(String method, String payload) {
		this.method = method;
		this.payload = payload;
	}

	public void sendRequest(String url, boolean logIO, JSONObject headers) throws Exception {
		error = false;
		HttpURLConnection con = null;
		int responseCode = 0;
		try {
			if (logIO) {
				LOGGER.info("sendGet: Method: " + method);
				LOGGER.info("sendGet: URL: " + url);
				LOGGER.info("sendGet  PayLoad: " + payload);
			}

			URL obj = new URL(url);
			con = (HttpURLConnection) obj.openConnection();

			// optional default is GET
			con.setRequestMethod(method);
			con.setUseCaches(false);
			con.setDoInput(true);
			con.setDoOutput(true);

			// Header Request Needed
			//headerSent = createHeader(con, headers);

			// if(METHOD_GET.equals(method)){
			int timeOut = Integer.valueOf(config.getNdvrTimeout());
			con.setReadTimeout(timeOut);
			// }
			if (method.equals(METHOD_PUT) || method.equals(METHOD_POST)) {
				con.setRequestMethod(method);
				//con.setRequestProperty("Accept", "application/json");
				con.setRequestProperty("Accept", "*/*");
				//con.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
				con.setRequestProperty("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
				
				try {
					OutputStreamWriter writer = new OutputStreamWriter(con.getOutputStream(), "UTF-8");
					writer.write(payload);
					writer.flush();
					writer.close();
				} catch (IOException e) {
					error = true;
					responseResult = e.getMessage();
				}
			} else {
				// add request header
				//con.setRequestProperty("content-type", "application/json");
				con.setRequestProperty("content-type", "application/x-www-form-urlencoded; charset=UTF-8");
			}

			StringBuffer response = null;
			if (!error && responseResult == null) {
				try {
					responseCode = con.getResponseCode();
					if (logIO) {
						LOGGER.info("Response Code : " + responseCode);
					}

					BufferedReader in = null;
					if (responseCode < 400) {
						in = new BufferedReader(new InputStreamReader(con.getInputStream(), "utf-8"));
					} else {
						error = true;
						InputStream errorStream = con.getErrorStream();
						if (errorStream != null) {
							in = new BufferedReader(new InputStreamReader(errorStream, "utf-8"));
						}
					}
					String inputLine;
					response = new StringBuffer();

					if (in != null) {
						while ((inputLine = in.readLine()) != null) {
							response.append(inputLine);
						}
						in.close();
					}

				} catch (IOException e) {
					response = new StringBuffer();
					response.append(e.getMessage());
				}
				// print result
				// LOGGER.info("Response : " + response.toString());
				responseResult = response.toString();
			}
			if (logIO) {
				LOGGER.info("Response : " + responseResult);
			}
			if (responseResult.indexOf(TIME_OUT) > 0 || responseResult.indexOf(REFUSED) > 0) {
				error = true;
			}
			if (error) {
				JSONObject jsonErrorResponse = null;
				JSONObject jsonErrorContainer =  new JSONObject();
				try{
					JSONArray errorArray =  getArrayObject();
					if(errorArray!=null){
						jsonErrorResponse = new JSONObject();
						jsonErrorResponse.put("ERROR", errorArray);
						jsonErrorContainer = jsonErrorResponse;
					}else{
						jsonErrorResponse = new JSONObject(responseResult);
						jsonErrorContainer.put("ERROR", jsonErrorResponse);
					}
					jsonErrorContainer.put("type", "errorObj");
					responseResult = jsonErrorContainer.toString();
				}catch(JSONException jex){
					LOGGER.error("ERROR thrown after request is not an jsonObject");
				}
				if (jsonErrorResponse == null) {
					if (responseCode > 0) {
						if (responseCode == 404) {
							responseResult = "The requested resource () is not available.";
						} else if (responseResult.indexOf("503") > 0) {
							responseResult = "No server is available to handle this request.";
						} else {
							try {
								responseResult = responseResult.substring(responseResult.indexOf("message")	
										+ "message".length() 
										+ 4, responseResult.indexOf("<", responseResult.indexOf("message")	+ "message".length() + 4));
							} catch (Exception ex) {
								LOGGER.error(responseResult + ": " + ex.getMessage());
							}

						}
					}
					responseResult = "{\"ERROR\" : \"" + "Error Code=" + responseCode + ", description=" + responseResult.replaceAll("\"", "") + "\"}";
				}
			} else {
				if (headers.length() > 0) {
					reponseHeader = con.getHeaderFields();
				}
			}

		} finally {
			if (con != null) {
				con.disconnect();
			}
		}
	}

	public Map<String, List<String>> getResponseHeader() {
		return reponseHeader;
	}

	// HTTP GET request
	public void sendRequest(String url, boolean logIO) throws Exception {
		sendRequest(url, logIO, new JSONObject());
	}

	public String getHeaderSent() {
		return headerSent;
	}

	public String getResponseResult() {
		return responseResult;
	}

	public boolean isError() {
		return this.error;
	}

	private String createHeader(HttpURLConnection connection, JSONObject headers) throws JSONException {
		// headerSent = "{" + CUSTOM_INFO_CORRELATION_ID_TAG + ": " +
		// correlationId + ", " + CUSTOM_INFO_SOURCE_TAG + ": " + SOURCE_NAME +
		// "}";
		MDC.put("reqtype", method);

		String correlationId = UUID.randomUUID().toString();
		MDC.put("correlationId", correlationId);
		JSONObject headerObj = new JSONObject();
		connection.setRequestProperty(CUSTOM_INFO_CORRELATION_ID_TAG, correlationId);
		headerObj.put(CUSTOM_INFO_CORRELATION_ID_TAG, correlationId);
		connection.setRequestProperty(CUSTOM_INFO_SOURCE_TAG, SOURCE_NAME);
		headerObj.put(CUSTOM_INFO_SOURCE_TAG, SOURCE_NAME);

		Iterator<String> keys = headers.keys();
	    while (keys.hasNext()) {
	        String key = keys.next();
	        String value = headers.getString(key);
	        connection.setRequestProperty(key, value);
	        headerObj.put(key, value);
	    }

		return headerObj.toString();
	}
	
	private JSONArray getArrayObject() {
		JSONArray errorArray = null;
		try {
			if (isJsonArray()) {
				errorArray = new JSONArray(responseResult);
			}
		} catch (JSONException e) {
			LOGGER.info("ERROR the error thronw is not an array");
		}
		return errorArray;
	}
	
	private boolean isJsonArray(){
		return (responseResult.substring(0, 1).equals("["));
	}
}
