package com.demo.monitor;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.demo.util.ConfigReader;

/**
 * Servlet implementation class MonitorService
 */
public class MonitorService extends HttpServlet {
	private static final long serialVersionUID = 1L;
	public static final String ACTION_CREATE_FILE = "CREATEFILE";
	public static final String ACTION_GET_URI = "GET_URI";
	public static final String ACTION_GET_ID = "GET_ID";
	public static final String ACTION_SHOW_ENDPOINTS = "SHOWENPOINTS";
	public static final String ACTION_GET_FILE = "GETFILE";
	public static final String ACTION_READ_LOG = "READLOG";
	public static final String ACTION_SHOW_RECORDABLE_CHANNELS = "SHOWRECORDABLECHANNELS";
	private ConfigReader config = ConfigReader.getInstance();
	static final Logger LOGGER = Logger.getLogger(MonitorService.class);
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public MonitorService() {
        super();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		JSONObject responseServer = new JSONObject();
		MonitorController monitor = null;
		String subscriber = null;
		response.setCharacterEncoding("utf8");
        response.setContentType("application/json");
        PrintWriter out = response.getWriter(); 

		try {
			JSONObject clientMessage = (JSONObject) request.getAttribute("data");
			String actionService = clientMessage.getString("actionService");
			//subscriber = clientMessage.getString("subscriber");
			switch (actionService) {
			case ACTION_CREATE_FILE:
				monitor = new MonitorController();
				JSONArray content = clientMessage.getJSONArray("item");
				monitor.createTestFile(subscriber, content);
				responseServer.put("info", "created");
				break;
			case ACTION_GET_FILE:
				monitor = new MonitorController();
				String fileName = clientMessage.getString("fileName");
				String contentFile = monitor.readFile(subscriber, fileName);
				responseServer.put("contentFile", contentFile);
				break;
			case ACTION_GET_URI:
				monitor = new MonitorController();
				String uri = clientMessage.getString("uri");
				JSONObject uriObj = monitor.getUriObj(uri);
				responseServer.put("uriObj", uriObj);
				break;
			case ACTION_GET_ID:
				monitor = new MonitorController();
				String id = clientMessage.getString("id");
				String component = clientMessage.getString("component");
				JSONObject idObj = monitor.getIdObj(id, component);
				responseServer.put("idObj", idObj);
				break;
			default:
				break;
			}
			out.print(responseServer);
		} catch (JSONException e) {
			e.printStackTrace();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

}
