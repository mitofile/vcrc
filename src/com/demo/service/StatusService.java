
package com.demo.service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.demo.util.ConfigReader;

@Path("status")
public class StatusService {

    public static final String NAME_FIELD = "name";
    public static final String VERSION_FIELD = "version";

    public static final String STATUS_FIELD = "status";
    public static final String STATUS_MESSAGE_FIELD = "status_message";
    public static final String ENVIRONMENT_FIELD = "env";
    public static final String DATE_FIELD = "date";
    public static final String CONFIG_FIELD = "config";
    public static final String STARTUP_DATE_FIELD = "startup_date";
    public static final String DEPENDENCIES_FIELD = "dependencies";

    private static final String CONTENT_TYPE = MediaType.APPLICATION_JSON;

    private final String applicationName;
    private String status;
    private String status_message;
    private final Map<String, String> environmentProperties;
    private final String startupDate;
    private final SimpleDateFormat SDF = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
    TimeZone tz = TimeZone.getTimeZone("UTC");

    public StatusService() {
        SDF.setTimeZone(tz);
        applicationName = "webClient";
        environmentProperties = System.getenv();
        startupDate = SDF.format(new Date(Long.valueOf(System.getProperty("startupTime"))));
        status = "up";
        status_message = "up and running";
    }

    @GET
    @Produces(CONTENT_TYPE)
    public Response statusInfo(@Context HttpServletRequest req) {
        Map<String, Object> info = new HashMap<String, Object>();

        info.put(NAME_FIELD, applicationName);
        info.put(VERSION_FIELD, ConfigReader.getInstance().getAppVersion());
        info.put(STATUS_FIELD, status);
        info.put(STATUS_MESSAGE_FIELD, status_message);
        info.put(DEPENDENCIES_FIELD, new HashMap<String, Object>());
        info.put(CONFIG_FIELD, ConfigReader.getInstance().getConfigsMap());
        info.put(DATE_FIELD, SDF.format(new Date()));
        info.put(STARTUP_DATE_FIELD, startupDate);
        info.put(ENVIRONMENT_FIELD, environmentProperties);

        return Response.ok(info).build();
    }
}
