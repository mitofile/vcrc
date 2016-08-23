package com.demo.util;

import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.concurrent.TimeUnit;

import org.json.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

public class TrailerDownloader {
	private String dest;
	private String mockSource;

	public void executeDownload() {
		ArrayList<String> mockList = getMockFiles(mockSource + "/onDemandMock/vod_Metadata/");
		int totalFiles = mockList.size();
		int fileCount = totalFiles;
		System.out.println("Target Files: " + totalFiles);
		String fileName = null;
		boolean averageSize = false;
		int totalMBDownloaded = 0;
		for (String filePath : mockList) {
			try {
				System.out.println(filePath);
				String fileContent = readFile(filePath);
				File file = new File(filePath);
				fileName = file.getName().substring(0,file.getName().length() - 5);
				JSONObject mockJson = new JSONObject(fileContent);
				if(hasTrailerFile(mockJson , fileName + ".mp4")){
					System.out.println("Discarding downloaded file. " + fileName + ".mp4");
					System.out.println("adding file attribute \"localTrailer\" : " + "\"" + fileName + ".mp4\"");
					mockJson.put("localTrailer", fileName + ".mp4");
					writeFile(filePath, mockJson.toString());
					System.out.println(file.getName() + " file updated.");
					System.out.println("____________________________________________________________");
					totalFiles = totalFiles -1;
					System.out.println("Pending Files: " + totalFiles);
					System.out.println("Completed: " + ((fileCount - totalFiles)*100)/fileCount + "%");
					continue;
				}
				String urlVideoFile = getPreview(mockJson);
				if (urlVideoFile != null) {
					int size = saveFile(urlVideoFile, dest, fileName);
					if (!averageSize) {
						int totalMB = mockList.size() * (size / 1024000);
						System.out.println("Average size to be downloaded: " + totalMB + "MB");
						averageSize = true;
					}
					System.out.println("adding file attribute \"localTrailer\" : " + "\"" + fileName + ".mp4\"");
					mockJson.put("localTrailer", fileName + ".mp4");
					writeFile(filePath, mockJson.toString());
					System.out.println(file.getName() + " file updated.");
					totalMBDownloaded = totalMBDownloaded + (size / 1024000);
					System.out.println("total MB donwloaded : " + totalMBDownloaded + "MB");
					System.out.println("____________________________________________________________");
				} else {
					System.out.println("ERROR - urlVideoFile : " + urlVideoFile);
					System.out.println("____________________________________________________________");
				}
			} catch (IOException e) {
				System.out.println("ERROR - " + e.getMessage());
			} catch (JSONException e) {
				System.out.println("ERROR - " + e.getMessage());
			}
			totalFiles = totalFiles -1;
			System.out.println("Pending Files: " + totalFiles);
			System.out.println("Completed: " + ((fileCount - totalFiles)*100)/fileCount + "%");
		}
	}

	private boolean hasTrailerFile(JSONObject mockJson, String videoFileStr){
		boolean result = false;
		try {
			if(mockJson.getString("localTrailer").length()>0){
				String videoFilePath = dest + "/" + mockJson.getString("localTrailer");
				File videoFile = new File(videoFilePath);
				if(videoFile.exists()){
					return true;
				}		
			}
		} catch (JSONException e) {
			System.out.println("Attribute localTrailer is missing");
			String videoFilePath = dest + "/" + videoFileStr;
			File videoFile = new File(videoFilePath);
			if (videoFile.exists()) {
				return true;
			}

		}
		return result;
	}
	
	public static void writeFile(String path, String content) throws IOException{
		File file = new File(path);
		if(file.exists() && file.isFile()){
			Path pathFile = Paths.get(file.getCanonicalPath());
			Files.write(pathFile, content.getBytes(), StandardOpenOption.TRUNCATE_EXISTING);
		}
	}
	
	private String readFile(String fileName) throws IOException {
		BufferedReader br = new BufferedReader(new FileReader(fileName));
		try {
			StringBuilder sb = new StringBuilder();
			String line = br.readLine();

			while (line != null) {
				sb.append(line);
				sb.append("\n");
				line = br.readLine();
			}
			return sb.toString();
		} finally {
			br.close();
		}
	}

	private ArrayList<String> getMockFiles(String mockSource) {
		ArrayList<String> fileNames = new ArrayList<>();
		try (DirectoryStream<Path> directoryStream = Files
				.newDirectoryStream(Paths.get(mockSource))) {
			for (Path path : directoryStream) {
				fileNames.add(path.toString());
			}
		} catch (IOException ex) {
			System.out.println("ERROR - " + ex.getMessage());
		}
		return fileNames;
	}

	public String getPreview(JSONObject jsonMock){
		JSONObject trailer = null;
		String urlTrailer = null;
		String videoItem = null;
		JSONObject jsonTrailer;
		JSONObject jsonQualityTrailer = null;
		try {
			jsonTrailer = jsonMock.getJSONObject("trailer");
			JSONArray jsonArray = jsonTrailer.getJSONArray("qualities");
			try {
				int maxValue = 0;
			    int indexMax = 0;
				for (int i = 0; i < jsonArray.length(); i++) {
					String quality = jsonArray.getJSONObject(i).getString("quality");
					int value = Integer.valueOf(quality.substring(0, quality.length()-1));
					if(maxValue< value){
						indexMax = i;
					}
				}
				jsonQualityTrailer = jsonArray.getJSONObject(indexMax);
				System.out.println("Max Video Quality detected: " + jsonQualityTrailer.getString("quality"));
				urlTrailer = jsonQualityTrailer.getString("videoURL");
				System.out.println("Url Video File: " + urlTrailer);
				Document doc = Jsoup.connect(urlTrailer).get();
				String htmlPage = doc.toString();
				int start = htmlPage.indexOf("videoPlayerObject") - 1;
				int end = htmlPage.indexOf("}}", start) + 2;
				videoItem = htmlPage.substring(start, end);
				trailer = new JSONObject("{" + videoItem + "}");
				return trailer.getJSONObject("videoPlayerObject").getJSONObject("video").getString("url");
			} catch (JSONException | IOException e) {
				System.out.println("ERROR - " + e.getMessage());
			}
		} catch (JSONException e2) {
			System.out.println("ERROR - " + e2.getMessage());
		}
      return null;
	}

	private int getFileSize(URL url) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("HEAD");
            conn.getInputStream();
            return conn.getContentLength();
        } catch (IOException e) {
        	System.out.println("ERROR - " + e.getMessage());
        	return 0;
        } finally {
            conn.disconnect();
        }
    }
	
	private int saveFile(String fileUrl, String folderDest, String fileName) throws IOException {
		long start = System.currentTimeMillis();
		URL url = new URL(fileUrl);
		int size = getFileSize(url);
		fileName = fileName + ".mp4";
		System.out.println(fileName + " - File size: " + size/1024000 + "MB");
		File directory = new File(folderDest);
		if (directory != null && directory.getCanonicalPath() != null) {
			InputStream is = url.openStream();
			OutputStream os = new FileOutputStream(folderDest + "/"	+ fileName);

			byte[] b = new byte[2048];
			int length;

			while ((length = is.read(b)) != -1) {
				os.write(b, 0, length);
			}

			is.close();
			os.close();
		}
		long end = System.currentTimeMillis();
		long timeMilli = end - start;
		long timeMinute = TimeUnit.MILLISECONDS.toMinutes(timeMilli);
		timeMilli -= TimeUnit.MINUTES.toMillis(timeMinute);
		long timeSec = TimeUnit.MILLISECONDS.toSeconds(timeMilli);
		System.out.println(fileName + " - download duration: " + ((end-start)>=1000?timeMinute + "min " + timeSec + "sec":(end-start) + " milisec"));
		return size;
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
		TrailerDownloader trailer = new TrailerDownloader();
		//trailer.setMockSource("C:/MainFolder/glassfish4/glassfish/domains/domain1/eclipseApps/vcrc/WEB-INF/classes/com/arris/dataMock");
		//trailer.setDest("C:/MainFolder/glassfish4/glassfish/domains/domain1/docroot");
		trailer.setMockSource(args[0]);
		trailer.setDest(args[1]);
		trailer.executeDownload();		
	}

}
