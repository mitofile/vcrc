package com.demo.util;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;

import org.apache.log4j.MDC;
import org.json.JSONException;
import org.json.JSONObject;

import com.demo.service.ServerService;
import com.demo.service.ServiceGet;

/**
 * @author Iacono Diego
 */
public class AuthenticationFilter implements Filter {

	@Override
	public void init(FilterConfig filterConfig) throws ServletException {
		// TODO Auto-generated method stub

	}

	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
		String subscriber = "system";
		String actionService = null;
		ConfigReader config = ConfigReader.getInstance();
		String line = null;
		StringBuffer jsonObjStr = new StringBuffer();
		BufferedReader reader = new BufferedReader(new InputStreamReader(request.getInputStream()));
		while ((line = reader.readLine()) != null) {
			jsonObjStr.append(line);
		}
		JSONObject clientMessage = null;
		try {
			clientMessage = new JSONObject(jsonObjStr.toString());
			actionService = clientMessage.getString("actionService");
			if (ServerService.ACTION_GET.equals(actionService)) {
				subscriber = getSubscriber(ServiceGet.ITEM_RECORDING_SCHEDULE, clientMessage);
			} else {
				subscriber = clientMessage.getString("subscriberName");
			}

		} catch (JSONException e) {
			subscriber = "unknown_User";
		}
		request.setAttribute("data", clientMessage);
		MDC.put("appVersion", config.getAppVersion());
		MDC.put("correlationId", "internal");
		MDC.put("hostname", request.getServerName());
		MDC.put("reqtype", "GET");
		MDC.put("userName", subscriber);

		chain.doFilter(request, response);

	}

	private String getSubscriber(String typeUser, JSONObject jsonObj) throws JSONException {
		String result = "unknown_User";
		JSONObject jsonRecords;
		jsonRecords = jsonObj.getJSONObject(typeUser);
		result = jsonRecords.getString("subscriber");
		return result;
	}

	@Override
	public void destroy() {
		// TODO Auto-generated method stub

	}

}
