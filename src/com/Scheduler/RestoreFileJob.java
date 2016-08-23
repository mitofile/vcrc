
package com.Scheduler;

import java.util.Date;

import org.apache.log4j.Logger;
import org.apache.log4j.MDC;

import com.demo.util.ConfigReader;
import com.demo.util.FileUtil;

public class RestoreFileJob implements Runnable {
    private ConfigReader config = ConfigReader.getInstance();
    public static final String EXECUTION_DELAY = "ExecutionDelay";
    static final Logger LOGGER = Logger.getLogger(RestoreFileJob.class);

    @Override
    public void run() {
        MDC.put("appVersion", config.getAppVersion());
        MDC.put("correlationId", "internal");
        MDC.put("hostname", "Unknow");
        MDC.put("reqtype", "GET");

        long delayLong = 20;
        try {
            Thread.sleep(delayLong * 1000L);
        } catch (Exception ignore) {
            LOGGER.warn("WARN ", ignore);
        }

        LOGGER.info("RestoreFileJob executed:  " + new Date());

        LOGGER.info("Restoring Poster Files. " + new Date());
        FileUtil.restoreFilesInWebContent(config.getPosterFolderPath(), config.getProjectPath() + "/posterImage");
        LOGGER.info("Restoring Channel Icon Files. " + new Date());
        FileUtil.restoreFilesInWebContent(config.getChannelIconFolderPath(), config.getProjectPath() + "/channelLogo");
        Thread.interrupted();
    }

}
