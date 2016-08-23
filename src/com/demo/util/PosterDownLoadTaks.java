package com.demo.util;

import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.Task;

public class PosterDownLoadTaks extends Task {
	private String subscriber;
	private String cachePath;
	private String projectPath;
	private boolean forceCatchup;
	private boolean forceSubcriber;
	private boolean testDownload;
	
	
	public void execute() throws BuildException {
		PosterDownloadTool tool = new PosterDownloadTool();
		tool.setSubscriber(subscriber);
		tool.setCachePath(cachePath);
		tool.setProjetPath(projectPath);
		tool.setForceCatchupPoster(forceCatchup);
		tool.setForceSubscriberPoster(forceSubcriber);
		tool.setTestDownload(testDownload);
		tool.executeTool();
	}


	public String getSubscriber() {
		return subscriber;
	}


	public void setSubscriber(String subscriber) {
		this.subscriber = subscriber;
	}


	public String getCachePath() {
		return cachePath;
	}


	public void setCachePath(String cachePath) {
		this.cachePath = cachePath;
	}


	public String getProjectPath() {
		return projectPath;
	}


	public void setProjectPath(String projectPath) {
		this.projectPath = projectPath;
	}


	public boolean isForceCatchup() {
		return forceCatchup;
	}


	public void setForceCatchup(boolean forceCatchup) {
		this.forceCatchup = forceCatchup;
	}


	public boolean isForceSubcriber() {
		return forceSubcriber;
	}


	public void setForceSubcriber(boolean forceSubcriber) {
		this.forceSubcriber = forceSubcriber;
	}


	public boolean isTestDownload() {
		return testDownload;
	}


	public void setTestDownload(boolean testDownload) {
		this.testDownload = testDownload;
	}

}
