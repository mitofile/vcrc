package com.demo.epg.dao;

import java.sql.*;

import org.apache.log4j.Logger;


public abstract class DAO {
	static final Logger LOGGER = Logger.getLogger(DAO.class);
	
	protected int executeUpdate(Connection conn, String query) throws SQLException {
		int result = 0;
		Statement stmt  = null;
		try{
			if(conn!=null){
				stmt  =  conn.createStatement();
				result = stmt.executeUpdate(query);
				conn.commit();
				
			}
		}catch(SQLException ex){
		  throw new SQLException(ex.getMessage());
		}finally{
			closeConnection(conn, stmt);
		}
		return result;
	}

	protected void closeConnection(Connection conn, Statement stmt) {
		try{
			if(stmt!=null){
				stmt.close();
			}
		}catch(SQLException e){
			LOGGER.info("ERROR: " + e.getMessage());
		}
		try{
			if(conn!=null){
				conn.close();
			}
		}catch(SQLException e){
			LOGGER.info("ERROR: " + e.getMessage());
		}
	}
	
}
