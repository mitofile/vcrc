package com.demo.util;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;

import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.Task;

public class TaskNdvr extends Task {
	private String url;
	private String method;
	private String payload;
	private String fileName;
	private String channelList;
	private String reference;
	private String programId;
	private String moxiSchedule;
	private String channelPackageId;
	
	public void execute() throws BuildException {
		String urlEndPoint = url;
		System.out.println(url);
		URL obj;
		try {
			obj = new URL(urlEndPoint);

			HttpURLConnection con = (HttpURLConnection) obj.openConnection();

			// optional default is GET
			con.setRequestMethod(method);
			if(method.equals("PUT") || method.equals("POST")){
				con.setDoInput(true);
				con.setDoOutput(true);
				con.setRequestMethod(method);
				con.setRequestProperty("Accept", "application/json");
				con.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
			        OutputStreamWriter writer = new OutputStreamWriter(con.getOutputStream(), "UTF-8");
			        System.out.println("PayLoad: " + payload);
			        writer.write(payload);
			        writer.close();
			}else{
				// add request header
				con.setRequestProperty("content-type", "application/json");
			}


			int responseCode = con.getResponseCode();
			System.out.println("\nSending " + method +" request to URL : " + url);
			System.out.println("Response Code : " + responseCode);
			BufferedReader in = null;
			if(responseCode<400){
				in = new BufferedReader(new InputStreamReader(con.getInputStream()));
			}else{
				in = new BufferedReader(new InputStreamReader(con.getErrorStream()));
			}

			String inputLine;
			StringBuffer response = new StringBuffer();
			File file = null;
			BufferedWriter output = null;
			if(fileName!=null && !fileName.equals("")){
				file = new File(fileName);
				output = new BufferedWriter(new FileWriter(file));
			}
			boolean channelData = false;
			StringBuffer channelListInfo = null;
			while ((inputLine = in.readLine()) != null) {
				if(file!=null){
					if(channelList!=null && Boolean.parseBoolean(channelList)){
						if(inputLine.contains("lst name=\"channel_id\"")){
							channelData = true;
							channelListInfo = new StringBuffer();
							continue;
						}
						if(channelData && inputLine.contains("\"")){
							inputLine = inputLine.replaceAll("\\s+", "");
							inputLine = inputLine.replaceAll("\\t+", "");
							inputLine = inputLine.replaceAll("\\n+", "");
							String channel = inputLine.split("\"")[1]; 
							if(channel.matches("-?\\d+(\\.\\d+)?")){
								channelListInfo.append(channel);
								channelListInfo.append(",");
							}

						}
					}else if(Boolean.parseBoolean(reference)){
						
					}else if(Boolean.parseBoolean(programId)){

					}else if(Boolean.parseBoolean(moxiSchedule)){

					}else if(Boolean.parseBoolean(channelPackageId)){

					}else{
						output.write(inputLine);
						output.write("\n");
					}
				  
				}
				response.append(inputLine);
			}
			
			in.close();
			if(output!=null && channelList!=null && Boolean.parseBoolean(channelList)){
				String result =channelListInfo.toString().substring(0, channelListInfo.toString().length()-1);
				output.write(result);
				output.close();
			}
			
			if(Boolean.parseBoolean(reference)){
				printRecRef(response.toString(), file);
			}
			
			if(Boolean.parseBoolean(programId)){
				printProgramId(response.toString(), file);
			}
			
			if(Boolean.parseBoolean(moxiSchedule)){
				printMoxiSchedules(response.toString(), file);
			}
			
			if(Boolean.parseBoolean(channelPackageId)){
				printchannelPackageId(response.toString(), file);
			}

			// print result
			System.out.println(response.toString());
			
		} catch (IOException e) {
			System.out.println("Task Fail: " + e.getMessage());
		}

	}
	
	
	private void printchannelPackageId(String response, File outputFile) throws IOException{
		String a[] = response.split(",");
		String outStr = "";
		for(String b : a){
			if(b.contains("entities\":[{\"id\"")){
				 outStr = outStr + b.split(":")[2];
				 break;
			}	
		}
		if(outStr.length()<1){
			System.out.println("-------------NO RECORDS FOUNDS------");
		}else{
			BufferedWriter output = null;
		    output = new BufferedWriter(new FileWriter(outputFile));
		    output.write(outStr);
			output.close();
		}
	}
	
	
	private void printRecRef(String response, File outputFile) throws IOException{
		String a[] = response.split("\"id\":");
		String outStr = "";
		for(String b : a){
			if(b.contains("\"alias\":\"recording\"")){
				 outStr = outStr + b.split(",")[0] + ",";
			}	
		}
		if(outStr.length()<1){
			System.out.println("-------------NO RECORDS FOUNDS------");
		}else{
			String result = outStr.substring(0, outStr.length()-1);
			BufferedWriter output = null;
		    output = new BufferedWriter(new FileWriter(outputFile));
		    output.write(result);
			output.close();
		}
	}
	
	
	private void printProgramId(String response, File outputFile) throws IOException{
		String a[] = response.split("\"programId\":");
		String outStr = "";
		for(String b : a){
			if(b.contains("\",\"programStartTime\"")){
				 outStr = outStr + b.split(",")[0].substring(1,b.split(",")[0].length()-1 ) + ",";
			}	
		}
		if(outStr.length()<1){
			System.out.println("-------------NO RECORDS FOUNDS------");
		}else{
			String result = outStr.substring(0, outStr.length()-1);
			BufferedWriter output = null;
		    output = new BufferedWriter(new FileWriter(outputFile));
		    output.write(result);
			output.close();
		}
	}
	
	private void printMoxiSchedules(String response, File outputFile) throws IOException{
		String a[] = response.split(",");
		StringBuffer outStr = new StringBuffer();
		String dvrTask = null;
		String dvrRecording =null;
		String showBegin = null;
		String item = null;
		for(String b : a){
			if(dvrTask==null){
			   if(b.contains("mws_dvr_task_id")){
				  dvrTask =	b.split(":")[b.split(":").length-1];
			   }
			}else if(dvrTask!=null && dvrRecording == null){
				if(b.contains("mws_dvr_recording_id")){
					dvrRecording =	b.split(":")[b.split(":").length-1];
				}
			}else if (dvrTask!=null && dvrRecording !=null && showBegin==null){
				if(b.contains("tms_showing_begin")){
					showBegin =	b.split(":")[b.split(":").length-1];
				}
			}else if(dvrTask!=null && dvrRecording!=null && showBegin!=null){
				item = dvrTask + "_" + dvrRecording + "_" + showBegin + ",";
				outStr.append(item);
				dvrTask = null;
				dvrRecording = null;
				showBegin = null;
			}else{
				dvrTask = null;
				dvrRecording = null;
				showBegin = null;
			}	
		}
		if(outStr.length()<1){
			System.out.println("-------------NO RECORDS FOUNDS------");
		}else{
			String result = outStr.substring(0, outStr.length()-1);
			BufferedWriter output = null;
		    output = new BufferedWriter(new FileWriter(outputFile));
		    output.write(result);
			output.close();
		}
	}
	

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public String getMethod() {
		return method;
	}

	public void setMethod(String method) {
		this.method = method;
	}

	public String getPayload() {
		return payload;
	}

	public void setPayload(String payload) {
		this.payload = payload;
	}

	public String getFileName() {
		return fileName;
	}

	public void setFileName(String fileName) {
		this.fileName = fileName;
	}

	public String getChannelList() {
		return channelList;
	}

	public void setChannelList(String channelList) {
		this.channelList = channelList;
	}


	public String getReference() {
		return reference;
	}


	public void setReference(String reference) {
		this.reference = reference;
	}
	
   public static void main(String[] args){
	   TaskNdvr a = new TaskNdvr();
//	   a.setUrl("http://192.168.0.1/mws/1/sources/dvr/tasks/?filter_text=");
//	   a.setMethod("GET");
//	   a.setFileName("C:/MainFolder/CrotoTypes/SVNRepo/development/vcrc/moxiScheduleIds.txt");
//	   a.setMoxiSchedule("true");
	   a.setMethod("GET");
	   a.setPayload("");
	   a.setUrl("http://10.26.68.103:8805/cs/services/v1/resource/recordingreference?expandChildren=true&scheduleEvent.subscriber=001DCE8E1DE1");
	   a.setFileName("C:/P4W/diacono_ZAR03-PROJ-233_3100/devicecontent/prototypes/trunk/vcrc/programId.txt");
	   a.setProgramId("true");
	   a.execute();
   }


public String getMoxiSchedule() {
	return moxiSchedule;
}


public void setMoxiSchedule(String moxiSchedule) {
	this.moxiSchedule = moxiSchedule;
}


public String getChannelPackageId() {
	return channelPackageId;
}


public void setChannelPackageId(String channelPackageId) {
	this.channelPackageId = channelPackageId;
}

public void setProgramId(String programId) {
	this.programId = programId;
}
	
	
}
