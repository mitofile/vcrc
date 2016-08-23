package com.Scheduler;

import java.io.File;
import java.io.IOException;
import java.util.Date;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.apache.log4j.Logger;
import org.apache.log4j.MDC;
import org.apache.log4j.PropertyConfigurator;

import com.demo.util.ConfigReader;

/**
 * @author Iacono Diego
 */
public class QuartzJobListener implements ServletContextListener {
	private ConfigReader config = ConfigReader.getInstance();
	static final Logger LOGGER = Logger.getLogger(QuartzJobListener.class);

	@Override
	public void contextInitialized(ServletContextEvent ctx) {
		System.setProperty("startupTime", ((Long) new Date().getTime()).toString());
		System.setProperty("log4JPath", ctx.getServletContext().getRealPath("/"));

		MDC.put("appVersion", config.getAppVersion());
		MDC.put("correlationId", "internal");
		MDC.put("hostname", "Unknow");
		MDC.put("reqtype", "GET");
		try {
			ServletContext context = ctx.getServletContext();
			String log4jConfigFile = context.getInitParameter("log4j-config-location");
			String fullPath = context.getRealPath("") + File.separator + log4jConfigFile;

			File file = new File(fullPath);
			String canonicalPath = file.getCanonicalPath();
			PropertyConfigurator.configure(canonicalPath);
			
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

	}

	public static long hoursBetweenDay(Date dateJob) {
		final int MILLI_TO_HOUR = 1000 * 60 * 60;
		Date today = new Date();
		long todayMilis = today.getTime();
		long lastDayMilis = dateJob.getTime();
		return (todayMilis - lastDayMilis) / MILLI_TO_HOUR;
	}

	public static long daysBetweenDay(Date dateJob) {
		long MILLSECS_PER_DAY = 24 * 60 * 60 * 1000;
		long today = System.currentTimeMillis();
		long past = dateJob.getTime();
		return (today - past) / MILLSECS_PER_DAY;
	}

	@Override
	public void contextDestroyed(ServletContextEvent event) {

		try {
			Integer threadLocalCount;
			ThreadLocalImmolater immolator = new ThreadLocalImmolater();
			threadLocalCount = immolator.immolate();
			LOGGER.info("Immolator.immolate() completed: immolated " + threadLocalCount + " values in ThreadLocals");
		} catch (Exception e) {
			LOGGER.info("caught exception raised by Immolator.immolate()", e);
		} finally {
			MDC.remove("userName");
		}
	}
}
