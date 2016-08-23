package com.demo.epg.dao;

import java.sql.*;
import java.util.*;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;

import com.demo.epg.model.*;

/**
 * @author diacono
 *
 */
public class ProgramDAO extends DAO {
	static final Logger LOGGER = Logger.getLogger(ProgramDAO.class);
	Connection conn = null;
	
	/**
	 * Constructor
	 */
	public ProgramDAO(Connection connection){
		conn = connection;
	}
	
	/**
	 * This method returns a list of Program  based on a list of channels and Start/End Time.
	 * @param channelList
	 * @param start
	 * @param end
	 * @return
	 * @throws SQLException
	 */
	public Collection<JSONObject> getProgramList(String channelList, long start, long end) throws SQLException{
		Statement stmt  = null;
		ResultSet rs = null;
		Collection<JSONObject> programGuide = new ArrayList<JSONObject>();
		String query = Program.SQL_Query_Program_Guide;
		String[] array = {};
		query = query.replace("{ChannelList}", channelList);
		query = query.replace("{start}", String.valueOf(start));
		query = query.replace("{end}", String.valueOf(end));
		try{
			if(conn!=null){
				stmt  =  conn.createStatement();
				rs = stmt.executeQuery(query);
				Program program = null;
				while(rs.next()){
					program = new Program();
					program.setId(rs.getLong(COLUMN_PROGRAM_ID));
					program.setProgramId(rs.getString(COLUMN_EXTERNAL_INDENTIFIER));
					program.setAir_date(rs.getString(COLUMN_AIR_DATE));
					program.setEnd_date(rs.getString(COLUMN_END_DATE));
					program.setTitle(rs.getString(COLUMN_TITLE));
					program.setAltSeries(rs.getString(COLUMN_ALT_SERIES_ID));
					program.setStationId(rs.getString(COLUMN_STATION_ID));
					program.setStationChannel(rs.getString(COLUMN_STATION_CHANNEL_ID));
					program.setTvRating(rs.getString(COLUMN_TV_RATING));
					program.setDescription(rs.getString(COLUMN_DESCRIPTION));
					program.setYear(rs.getString(COLUMN_YEAR));
					program.setCast(array);
					program.setProducer(array);
					try {
						programGuide.add(new JSONObject(program.toString()));
					} catch (JSONException e) {
						LOGGER.error("ERROR - Adding program into program guide List. " + e.getMessage());
					}
				}
			}
		}catch(SQLException ex){
			throw new SQLException(ex.getMessage());
		}finally{
			closeConnection(conn, stmt);
		}
		return programGuide;
	}
	
	/**
	 * This method returns the program information searching the program by programId
	 * @param programId
	 * @return
	 * @throws SQLException
	 */
	public Program getProgramInfo(String programId) throws SQLException{
		Program programInfo = null;
		Statement stmt = null;
		ResultSet rs = null;
		try{
			if(conn!=null){
				stmt  =  conn.createStatement();
				rs = stmt.executeQuery(Program.SQL_Query_Program_Info.replace("{ProgramId}", programId));
				programInfo = new Program();
				while(rs.next()){
						programInfo.setId(rs.getLong(COLUMN_PROGRAM_ID));
						programInfo.setAltSeries(rs.getString(COLUMN_ALT_SERIES_ID));
						programInfo.setDescription(rs.getString(COLUMN_DESCRIPTION));
						programInfo.setDuration(rs.getString(COLUMN_DURATION));
						programInfo.setEpisodeNumber(rs.getString(COLUMN_EPISODE_NUMBER));
						programInfo.setEpisodeTitle(rs.getString(COLUMN_EPISODE_TITLE));
						programInfo.setOriginalAirDate(rs.getString(COLUMN_ORIGINAL_AIR_DATE));
						programInfo.setProgramId(rs.getString(COLUMN_EXTERNAL_INDENTIFIER));
						programInfo.setRating(rs.getString(COLUMN_MPAA_RATING));
						programInfo.setRecommendationId(rs.getString(COLUMN_RECOMMENDATION_ID));
						programInfo.setSeasonNumber(rs.getString(COLUMN_SEASON_NUMBER));
						programInfo.setStartRatring(rs.getString(COLUMN_STAR_RATING));
						programInfo.setStationChannel(rs.getString(COLUMN_STATION_CHANNEL_ID));
						programInfo.setTitle(rs.getString(COLUMN_TITLE));
						programInfo.setTvRating(rs.getString(COLUMN_TV_RATING));
						programInfo.setYear(rs.getString(COLUMN_YEAR));
					}
					rs = stmt.executeQuery(Program.SQL_Query_Cast.replace("{ProgramId}", programId));
					ArrayList<String> castActorList = new ArrayList<String>();
					ArrayList<String> castWriterList = new ArrayList<String>();
					while(rs.next()){
						StringBuffer castperson = new StringBuffer();
						if(rs.getString(COLUMN_FIRST_NAME)!=null){
							castperson.append(rs.getString(COLUMN_FIRST_NAME));
							if(rs.getString(COLUMN_FIRST_NAME).trim().length()>0){
								castperson.append(" ");
							}
						}
						if(rs.getString(COLUMN_LAST_NAME)!=null){
							castperson.append(rs.getString(COLUMN_LAST_NAME));
						}
						if(rs.getString(COLUMN_CAST_ROLE).equals("Actor")){
							castActorList.add(castperson.toString());
						}else{
							castWriterList.add(castperson.toString());
						}
					}
					String[] array = new String[castActorList.size()];
					array = castActorList.toArray(array);
					programInfo.setCast(array);
					array = new String[castWriterList.size()];
					array = castWriterList.toArray(array);
					programInfo.setProducer(array);
			}else{
				throw new SQLException("The sql query can't be run. There was an issue with the connection.");
			}
		}catch(SQLException ex){
			throw new SQLException(ex.getMessage());
		}finally{
			closeConnection(conn, stmt);
		}
		return programInfo;
	}
	
	/**
	 * This method creates the indexes on the EPG DB recently downloaded.
	 * @throws SQLException
	 */
	public void createIndexes() throws SQLException{
		Statement stmt = null;
		try{
			if(conn!=null){
				stmt  =  conn.createStatement();
				for(String index:Program.TABLE_INDEX){
					StringBuilder str = new StringBuilder("CREATE INDEX ");
					str.append(index);
					str.append(";");
					LOGGER.info(str.toString());
					stmt.execute(str.toString());	
				}
			}else{
				throw new SQLException("Index creation can't be run because, there was an issue with the connection.");
			}
		}catch(SQLException ex){
			throw new SQLException(ex.getMessage());
		}finally{
			closeConnection(conn, stmt);
		}
	}
	
	private static final String COLUMN_PROGRAM_ID = "program_Id";
	private static final String COLUMN_EXTERNAL_INDENTIFIER = "external_identifier";
	private static final String COLUMN_TITLE = "title";
	private static final String COLUMN_DESCRIPTION = "description";
	private static final String COLUMN_YEAR = "year";
	private static final String COLUMN_MPAA_RATING = "mpaa_rating";
	private static final String COLUMN_STAR_RATING = "star_rating";
	private static final String COLUMN_EPISODE_NUMBER = "episode_number";
	private static final String COLUMN_ALT_SERIES_ID = "alt_series_id";
	private static final String COLUMN_EPISODE_TITLE = "episode_title";
	private static final String COLUMN_SEASON_NUMBER = "season_number";
	private static final String COLUMN_RECOMMENDATION_ID ="recommendation_id";
	private static final String COLUMN_ORIGINAL_AIR_DATE = "original_air_date";
	private static final String COLUMN_STATION_ID = "station_id";
	private static final String COLUMN_STATION_CHANNEL_ID = "station_channel_id";
	private static final String COLUMN_DURATION = "duration";
	private static final String COLUMN_TV_RATING = "tv_rating";
	private static final String COLUMN_FIRST_NAME = "first_name";
	private static final String COLUMN_LAST_NAME = "last_name";
	private static final String COLUMN_CAST_ROLE = "cast_role";
	private static final String COLUMN_AIR_DATE = "air_date";
	private static final String COLUMN_END_DATE = "end_date";

}
