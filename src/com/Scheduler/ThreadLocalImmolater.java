package com.Scheduler;

import java.lang.ref.WeakReference;
import java.lang.reflect.Array;
import java.lang.reflect.Field;

import org.apache.log4j.Logger;
import org.apache.log4j.MDC;

public class ThreadLocalImmolater {
	static final Logger LOGGER = Logger.getLogger(ThreadLocalImmolater.class);

	int immolate() {
		int count;
		try {
			MDC.put("userName", "System");
			MDC.put("reqtype", "GET");
			count = 0;
			final Field threadLocalsField = Thread.class.getDeclaredField("threadLocals");
			threadLocalsField.setAccessible(true);
			final Field inheritableThreadLocalsField = Thread.class.getDeclaredField("inheritableThreadLocals");
			inheritableThreadLocalsField.setAccessible(true);
			for (final Thread thread : Thread.getAllStackTraces().keySet()) {
				count += clear(threadLocalsField.get(thread));
				count += clear(inheritableThreadLocalsField.get(thread));
			}
			LOGGER.info("immolated " + count + " values in ThreadLocals");
		} catch (final Exception e) {
			throw new Error("die", e);
		} finally {
			MDC.remove("userName");
		}
		return count;
	}

	private static int clear(final Object threadLocalMap) throws Exception {
		if (threadLocalMap == null)
			return 0;
		int count = 0;
		final Field tableField = threadLocalMap.getClass().getDeclaredField("table");
		tableField.setAccessible(true);
		final Object table = tableField.get(threadLocalMap);
		for (int i = 0, length = Array.getLength(table); i < length; ++i) {
			final Object entry = Array.get(table, i);
			if (entry != null) {
				final Object threadLocal = ((WeakReference) entry).get();
				if (threadLocal != null) {
					Array.set(table, i, null);
					++count;
				}
			}
		}
		return count;
	}

}
