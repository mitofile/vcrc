
package com.demo.service;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Servlet implementation class MonitorService
 */
public class ChannelMapService extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private ChannelMapController chnController = null;
    static final Logger LOGGER = Logger.getLogger(ChannelMapService.class);

    /**
     * @see HttpServlet#HttpServlet()
     */
    public ChannelMapService() {
        super();
    }

    /**
     * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
     */
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setCharacterEncoding("utf8");
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();
        chnController = new ChannelMapController();
        JSONObject responseServer = chnController.readChannelMap();
        out.print(responseServer);
    }

    /**
     * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
     */
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException,
            IOException {
        JSONObject responseServer = new JSONObject();
        response.setCharacterEncoding("utf8");
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();
        JSONObject clientMessage = (JSONObject) request.getAttribute("data");
        if (clientMessage != null) {
            chnController = new ChannelMapController();
            responseServer = chnController.updateChannelMap(clientMessage);
        } else {
            try {
                responseServer.put("ERROR", "please check the information sent");
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        out.print(responseServer);
    }

}
