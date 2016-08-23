package com.demo.util;

import org.apache.tools.ant.*;

public class TrailerDownloaderTask extends Task {
	private String dest;
	private String mockSource;

	public void execute() throws BuildException {
		TrailerDownloader downloader = new TrailerDownloader();
		downloader.setDest(dest);
		downloader.setMockSource(mockSource);
		downloader.executeDownload();
	}

	/**
	 * @return the dest
	 */
	public String getDest() {
		return dest;
	}

	/**
	 * @param dest
	 *            the dest to set
	 */
	public void setDest(String dest) {
		this.dest = dest;
	}

	/**
	 * @return the mockSource
	 */
	public String getMockSource() {
		return mockSource;
	}

	/**
	 * @param mockSource
	 *            the mockSource to set
	 */
	public void setMockSource(String mockSource) {
		this.mockSource = mockSource;
	}
	
	public static void main (String[] args){
		TrailerDownloaderTask trailer = new TrailerDownloaderTask();
		//trailer.setMockSource("C:/MainFolder/glassfish4/glassfish/domains/domain1/eclipseApps/vcrc/WEB-INF/classes/com/arris/dataMock");
		//trailer.setDest("C:/MainFolder/glassfish4/glassfish/domains/domain1/docroot");
		trailer.setMockSource(args[0]);
		trailer.setDest(args[1]);
		trailer.execute();		
	}

}
