package com.demo.monitor;

//import java.io.*;
//import java.util.*;

import org.json.JSONException;
import org.json.JSONObject;

//import scala.util.parsing.json.JSON;


public class LogReader {
	//private ConfigReader config = ConfigReader.getInstance();
//	private String serverName = null;
//    private ArrayList<String> block = null;
//	private RandomAccessFile randomAccess = null; 
//	private File file = null;
//	private long linePointer  = 0;
	
	
	public LogReader(String serverName, long linePointer){
//		this.linePointer = linePointer;
//		this.serverName = serverName;
	}
	
	public JSONObject readLog() {
//		String uiServerLog = null;//config.getProjectPath() + "/WEB-INF/logs/ndvrMoxi.log";
//		uiServerLog = "/logs/ndvrMoxi.log";
//		file = new File(uiServerLog);
//		JSONObject json = new JSONObject();
//		try {
//			randomAccess = new RandomAccessFile( uiServerLog, "r" );
//			long fileLength = file.length();
//			if (linePointer == -1) {
//				linePointer = fileLength - 1;
//			}
//			if (fileLength < linePointer) {
//				randomAccess = new RandomAccessFile(uiServerLog, "r");
//				linePointer = 0;
//			}
//			if (fileLength > linePointer) {
//				randomAccess.seek(linePointer);
//				String line = randomAccess.readLine();
//				block = new ArrayList<String>();
//				while (line != null) {
//					block.add(line);
//					line = randomAccess.readLine();
//				}
//				linePointer = randomAccess.getFilePointer();
//			}
//			
//			json.put("line", block);
//			json.put("pointer", linePointer);
//			
//		} catch (FileNotFoundException e) {
//			e.printStackTrace();
//		} catch (IOException e) {
//			e.printStackTrace();
//		} catch (JSONException e) {
//			e.printStackTrace();
//		}
		JSONObject json = null;
		try {
			json = new JSONObject("{}");
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return json;
	}
	
}
