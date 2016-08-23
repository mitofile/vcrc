package com.demo.epg.dao;

import java.sql.*;
import java.util.ArrayList;

import org.apache.log4j.Logger;

import com.demo.epg.model.Channel;
import com.demo.util.ConfigReader;

/**
 * 
 * @author diacono
 *
 */
public class ChannelDAO extends DAO{
	static final Logger LOGGER = Logger.getLogger(ChannelDAO.class);
	Connection conn = null;
	private ConfigReader config = ConfigReader.getInstance();
	
	public ChannelDAO(Connection connection){
		conn = connection;
	}
	
	public ArrayList<Channel> getChannelList() throws SQLException {
		ResultSet rs = null;
		Channel channelInfo = null;
		Statement stmt = null;
		ArrayList<Channel> channelList = new ArrayList<Channel>();
		String query = Channel.QUERY_CHANNEL_LIST;
		try{
			if (conn != null) {
				stmt = conn.createStatement();
				rs = stmt.executeQuery(query);
				while (rs.next()) {
					channelInfo = new Channel();
					channelInfo.setName(rs.getString(ChannelDAO.COLUMN_CALL_SIGN));
					channelInfo.setStation_channel_id(rs.getString(ChannelDAO.COLUMN_STATION_CHANNEL_ID));
					channelInfo.setStation_id(rs.getString(ChannelDAO.COLUMN_STATION_ID));
					channelList.add(channelInfo);
				}
			}
		}catch(SQLException ex){
			throw new SQLException(ex.getMessage());
		}finally {
			closeConnection(conn, stmt);
		}
		return channelList;
	}
	
	public static final String COLUMN_STATION_CHANNEL_ID = "station_channel_id";
	public static final String COLUMN_STATION_ID = "station_id";
	public static final String COLUMN_CALL_SIGN = "call_sign";
	
}
