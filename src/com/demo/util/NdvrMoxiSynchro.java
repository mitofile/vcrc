package com.demo.util;

import java.io.*;

import org.apache.log4j.Logger;
import org.apache.tools.ant.*;
import org.json.JSONObject;

import com.demo.service.Service;

/**
 * @author Iacono Diego
 *  This class has the responsibility to sync all the information between Ndvr and Moxi.
 *  The only implemented way is to delete all the information in both systems.
 */
public class NdvrMoxiSynchro extends Service {
	private static final String ANT_FILE_NAME = "NdvrTool.xml";
	private static final String CLASS_LOCATION = "/WEB-INF/classes";
	private static final String PROPERTY_NAME = "ant.file";
	private static final String PROJECT_HELPER = "ant.projectHelper";
	private static final String TASK_TARGET = "Sync_Ndvr_Moxi";
	static final Logger LOGGER = Logger.getLogger(NdvrMoxiSynchro.class);

	public NdvrMoxiSynchro(){}
	
	public NdvrMoxiSynchro(ConfigReader config, JSONObject clientMessage) {
		this.config = config;
		this.clientMessage = clientMessage;
	}

	public void invokeTask() {
		System.out.println("Running Task from JAVA...........................");
		ConfigReader config = ConfigReader.getInstance();
		String projectPathClasses = config.getProjectPath() + CLASS_LOCATION;
		System.out.println("projectPathClasses: "  + projectPathClasses + "/" + ANT_FILE_NAME);
		File buildFile = new File(projectPathClasses + "/" + ANT_FILE_NAME);
		Project p = new Project();
		try {
			p.setUserProperty(PROPERTY_NAME, buildFile.getCanonicalPath());
		} catch (IOException e) {
			e.printStackTrace();
		}
		p.init();
		ProjectHelper helper = ProjectHelper.getProjectHelper();
		p.addReference(PROJECT_HELPER, helper);
		helper.parse(p, buildFile);
		p.executeTarget(TASK_TARGET);
	}
	
	
	public void invokeSyncMethod(){
		LOGGER.info("Error Sync method Deprecated!");
	}
	

	
	public static void main(String[] args){
		NdvrMoxiSynchro sync = new NdvrMoxiSynchro();
		sync.invokeTask();
		
	}
	
}
