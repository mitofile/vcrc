package com.demo.util;

import java.io.*;
import java.net.*;
import java.nio.charset.Charset;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.text.SimpleDateFormat;
import java.util.List;

import org.apache.log4j.Logger;


/**
 * @author Iacono Diego
 * This class is has static methods that makes the file operations. 
 */

public class FileUtil {
	static final Logger LOGGER = Logger.getLogger(FileUtil.class);
	public static final String FORMTATED_DAY = "yyyy-MM-dd HH:mm:ss";
	
	
	private static boolean isResourceAvailable(String urlString) throws IOException {
		boolean response = false;
		int responseCode = 0;
		URL url;

		url = new URL(urlString);
		HttpURLConnection.setFollowRedirects(false);
		HttpURLConnection http = (HttpURLConnection) url.openConnection();
		http.setRequestMethod("HEAD");
		http.connect();
		responseCode = http.getResponseCode();
		response = responseCode != 200 ? false : true;
		return response;
	}
	
	public static void saveImage(String imageUrl, String folderDestination,String fileName) throws IOException {
		File file = new File(folderDestination + "/" + fileName);
		if(!file.exists()){
			if(isResourceAvailable(imageUrl)){
				URL url = new URL(imageUrl);
				File directory = new File(folderDestination);
		        if (!directory.exists()) {
		            try {
		                boolean resultDirCreated = directory.mkdirs();
		                LOGGER.info("The Folder " + folderDestination + " was created." + resultDirCreated);
		                boolean success = directory.setReadable(true, false) && directory.setWritable(true, false);
						LOGGER.info("directory permission updated. Read and write enabled " + success);
		            } catch (SecurityException ex) {
		            	LOGGER.info("ERROR creating the directory");
		                ex.printStackTrace();
		                directory = null;
		            }
		        }
				if (directory != null && directory.getCanonicalPath() != null) {

					InputStream is = url.openStream();
					OutputStream os = new FileOutputStream(folderDestination + "/" + fileName);

					byte[] b = new byte[2048];
					int length;

					while ((length = is.read(b)) != -1) {
						os.write(b, 0, length);
					}

					is.close();
					os.close();
				}
			}	
		}
	}
	
	
	/**
	 * @param originFolderPath
	 * @param destinationFolderPath
	 */
	public static void restoreFilesInWebContent(String originFolderPath, String destinationFolderPath) {
		try {
			File originFolder = new File(originFolderPath);
			File destFolder = new File(destinationFolderPath);
			if (originFolder.exists() && originFolder.isDirectory()) {
				
				Path origin = Paths.get(originFolder.getCanonicalPath());
				Path destination = Paths.get(destFolder.getCanonicalPath());
				Files.walkFileTree(origin, new CopyFileVisitor(destination));

			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	public static void writeStatus(String path) throws IOException{
		File statusFile = new File(path);
		if(statusFile.exists() && statusFile.isFile()){			
			if(!statusFile.canWrite()){
				boolean success = statusFile.setReadable(true, false) && statusFile.setWritable(true, false);
				LOGGER.info("status file permission updated. Read and write enabled " + success);
			}
			SimpleDateFormat fmt = new SimpleDateFormat(FORMTATED_DAY);
			String dateRun =  fmt.format(System.currentTimeMillis());
			Path pathFile = Paths.get(statusFile.getCanonicalPath());
			Files.write(pathFile, dateRun.getBytes(), StandardOpenOption.WRITE);
		}
	}
	
	public static void writeFile(String path, String content) throws IOException{
		writeFile(path, content, false);
	}
	
	public static void writeFile(String path, String content, boolean create) throws IOException{
		File file = new File(path);
		if(file.exists() && file.isFile()){
			Path pathFile = Paths.get(file.getCanonicalPath());
			Files.write(pathFile, content.getBytes(), StandardOpenOption.TRUNCATE_EXISTING);
		}else if(create){
			Path pathFile = Paths.get(file.getCanonicalPath());
			try {
				file.createNewFile();
			} catch (IOException ex) {
				if(ex.getMessage().indexOf("path")>0){
					String dir = pathFile.getParent().toString();
					File dirDest  = new File(dir);
					dirDest.mkdirs();
				}
			}
			if(!file.exists()){
				file.createNewFile();	
			}
			pathFile = Paths.get(file.getCanonicalPath());
			Files.write(pathFile, content.getBytes(), StandardOpenOption.TRUNCATE_EXISTING);
		}
	}

	/**
	 * @return String line.
	 * 
	 */
	public static String readStatus(String path) {
		String result = "";

		File statusFile = new File(path);
		if(statusFile.exists() && statusFile.isFile()){
			try{
				if (statusFile.canRead() && statusFile.canWrite()) {
					try {
						Path filePath = Paths.get(statusFile.getCanonicalPath());
						List<String> lines = Files.readAllLines(filePath, Charset.defaultCharset());
						for (String line : lines) {
							result = line;
							break;
						}
					} catch (IOException e) {
						LOGGER.error("ERROR - the file: " + path + ". Can't read or write. " + e.getMessage());
						result = null;
					}
				}else{
					result = null;
				}
			}catch (SecurityException ex){
				LOGGER.error("ERROR - the file: " + path + ". Can't read or write. " + ex.getMessage());
				result = null;
			}
		}else{
			try {
				  statusFile.createNewFile();
				  boolean success = statusFile.setReadable(true, false) && statusFile.setWritable(true, false);
				  LOGGER.info("status file created. Read and write enabled " + success);
			} catch (IOException | SecurityException e) {
				LOGGER.error("The file " + path + ".Does not exist. Error - it can't be created.");
			}
		}
		return result;
	}
	
	public static boolean touchFile(String path){
		File file = new File(path);
		return file.exists();
	}
	
	public static void copyFileTo(String pathOrigin, String pathDest) throws IOException{
		File fileNew = new File(pathOrigin);
		File fileOld = new File(pathDest);
		Path from  = fileNew.toPath();
		Path to = fileOld.toPath();
		Files.copy(from, to, StandardCopyOption.REPLACE_EXISTING);
	}
}

/**
 * @author Iacono Diego
 *
 */
class CopyFileVisitor extends SimpleFileVisitor<Path> {
	private final Path targetPath;
	private Path sourcePath = null;

	public CopyFileVisitor(Path targetPath) {
		this.targetPath = targetPath;
	}

	@Override
	public FileVisitResult preVisitDirectory(final Path dir,
			final BasicFileAttributes attrs) throws IOException {
		if (sourcePath == null) {
			sourcePath = dir;
		} else {
			Files.createDirectories(targetPath.resolve(sourcePath
					.relativize(dir)));
		}
		return FileVisitResult.CONTINUE;
	}

	@Override
	public FileVisitResult visitFile(final Path file,
			final BasicFileAttributes attrs) throws IOException {
		Files.copy(file, targetPath.resolve(sourcePath.relativize(file)), StandardCopyOption.REPLACE_EXISTING);
		return FileVisitResult.CONTINUE;
	}
}