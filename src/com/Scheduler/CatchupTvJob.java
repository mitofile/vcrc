
package com.Scheduler;

import org.apache.log4j.Logger;
import org.apache.log4j.MDC;
import org.quartz.InterruptableJob;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.quartz.UnableToInterruptJobException;

import com.cache.CatchupTVCache;
import com.demo.util.ConfigReader;

/**
 * @author Iacono Diego
 */
public class CatchupTvJob implements InterruptableJob {
    static final Logger LOGGER = Logger.getLogger(CatchupTvJob.class);
    private ConfigReader config = ConfigReader.getInstance();

    private volatile boolean isJobInterrupted = false;
    private JobKey jobKey = null;
    private volatile Thread thisThread;

    @Override
    public void execute(JobExecutionContext ctx) throws JobExecutionException {
        try {

            MDC.put("appVersion", config.getAppVersion());
            MDC.put("correlationId", "internal");
            MDC.put("hostname", "Unknow");
            MDC.put("reqtype", "GET");

            LOGGER.info("JOB - CATCHUP TV cache process - Wakeup.");
            config.readConfigUiJson();
            CatchupTVCache.getInstance();
        } finally {
            LOGGER.info("JOB - CATCHUP TV cache process - finished.");
        }
    }

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
