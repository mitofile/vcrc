package com.demo.epg.model;

import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

import org.apache.commons.lang3.StringEscapeUtils;

/**
 * @author diacono
 *
 */
public class Program {

	private long id;
	private String programId;
	private String title;
	private String description;
	private String rating;
	private String startRatring;
	private String episodeNumber;
	private String altSeries;
	private String episodeTitle;
	private String seasonNumber;
	private String recommendationId;
	private String originalAirDate;
	private String stationChannel;
	private String stationId;
	private String duration;
	private String tvRating;
	private String genre;
	private String year;
	private String air_date;
	private String end_date;
	private String[] cast;
	private String[] producer;
	private String airingId;

	/**
	 * @return the id
	 */
	public long getId() {
		return id;
	}

	/**
	 * @param id
	 *            the id to set
	 */
	public void setId(long id) {
		this.id = id;
	}

	/**
	 * @return the programId
	 */
	public String getProgramId() {
		return programId;
	}

	/**
	 * @param programId
	 *            the programId to set
	 */
	public void setProgramId(String programId) {
		this.programId = programId;
	}

	/**
	 * @return the title
	 */
	public String getTitle() {
		return title;
	}

	/**
	 * @param title
	 *            the title to set
	 */
	public void setTitle(String title) {
		if (title != null) {
			this.title = StringEscapeUtils.escapeJson(title);
		} else {
			this.title = null;
		}
	}

	/**
	 * @return the rating
	 */
	public String getRating() {
		return rating;
	}

	/**
	 * @param rating
	 *            the rating to set
	 */
	public void setRating(String rating) {
		this.rating = rating;
	}

	/**
	 * @return the startRatring
	 */
	public String getStartRatring() {
		return startRatring;
	}

	/**
	 * @param startRatring
	 *            the startRatring to set
	 */
	public void setStartRatring(String startRatring) {
		this.startRatring = startRatring;
	}

	/**
	 * @return the episodeNumber
	 */
	public String getEpisodeNumber() {
		return episodeNumber;
	}

	/**
	 * @param episodeNumber
	 *            the episodeNumber to set
	 */
	public void setEpisodeNumber(String episodeNumber) {
		this.episodeNumber = episodeNumber;
	}

	/**
	 * @return the episodeTitle
	 */
	public String getEpisodeTitle() {
		return episodeTitle;
	}

	/**
	 * @param episodeTitle
	 *            the episodeTitle to set
	 */
	public void setEpisodeTitle(String episodeTitle) {
		if (episodeTitle != null) {
			this.episodeTitle = StringEscapeUtils.escapeJson(episodeTitle);
		} else {
			this.episodeTitle = null;
		}
	}

	/**
	 * @return the seasonNumber
	 */
	public String getSeasonNumber() {
		return seasonNumber;
	}

	/**
	 * @param seasonNumber
	 *            the seasonNumber to set
	 */
	public void setSeasonNumber(String seasonNumber) {
		this.seasonNumber = seasonNumber;
	}

	/**
	 * @return the recommendationId
	 */
	public String getRecommendationId() {
		return recommendationId;
	}

	/**
	 * @param recommendationId
	 *            the recommendationId to set
	 */
	public void setRecommendationId(String recommendationId) {
		this.recommendationId = recommendationId;
	}

	/**
	 * @return the originalAirDate
	 */
	public String getOriginalAirDate() {
		return originalAirDate;
	}

	/**
	 * @param originalAirDate
	 *            the originalAirDate to set
	 */
	public void setOriginalAirDate(String originalAirDate) {
		SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
		isoFormat.setTimeZone(TimeZone.getTimeZone("GMT"));
		try {
			this.originalAirDate = isoFormat.format(new Date(Long.parseLong(originalAirDate) * 1000L));
		} catch (NumberFormatException ex) {
			this.originalAirDate = "2014-11-26T11:34:34.003Z";
		}
	}

	/**
	 * @return the stationChannel
	 */
	public String getStationChannel() {
		return stationChannel;
	}

	/**
	 * @param stationChannel
	 *            the stationChannel to set
	 */
	public void setStationChannel(String stationChannel) {
		this.stationChannel = stationChannel;
	}

	/**
	 * @return the duration
	 */
	public String getDuration() {
		return duration;
	}

	/**
	 * @param duration
	 *            the duration to set in
	 */
	public void setDuration(String duration) {
		this.duration = String.valueOf(Integer.valueOf(duration) / 60);
	}

	/**
	 * @return the tvRating
	 */
	public String getTvRating() {
		return tvRating;
	}

	/**
	 * @param tvRating
	 *            the tvRating to set
	 */
	public void setTvRating(String tvRating) {
		this.tvRating = tvRating;
	}

	/**
	 * @return the genre
	 */
	public String getGenre() {
		return genre;
	}

	/**
	 * @param genre
	 *            the genre to set
	 */
	public void setGenre(String genre) {
		this.genre = genre;
	}

	/**
	 * @return the writer
	 */
	public String[] getProducer() {
		return producer;
	}

	/**
	 * @param writer
	 *            the writer to set
	 */
	public void setProducer(String[] producer) {
		if (producer == null) {
			this.producer = new String[0];
		} else {
			this.producer = Arrays.copyOf(producer, producer.length);
		}
	}

	/**
	 * @return the description
	 */
	public String getDescription() {
		return description;
	}

	/**
	 * @param description
	 *            the description to set
	 */
	public void setDescription(String description) {
		if (description != null) {
			this.description = StringEscapeUtils.escapeJson(description);
		} else {
			this.description = null;
		}

	}

	/**
	 * @return the cast
	 */
	public String[] getCast() {
		return cast;
	}

	/**
	 * @param cast
	 *            the cast to set
	 */
	public void setCast(String[] cast) {
		if (cast == null) {
			this.cast = new String[0];
		} else {
			this.cast = Arrays.copyOf(cast, cast.length);
		}
	}

	/**
	 * @return the altSeries
	 */
	public String getAltSeries() {
		return altSeries;
	}

	/**
	 * @param altSeries
	 *            the altSeries to set
	 */
	public void setAltSeries(String altSeries) {
		this.altSeries = altSeries;
	}

	/**
	 * @return the year
	 */
	public String getYear() {
		return year;
	}

	/**
	 * @param year
	 *            the year to set
	 */
	public void setYear(String year) {
		this.year = year;
	}

	public String getAir_date() {
		return air_date;
	}

	public void setAir_date(String air_date) {
		this.air_date = air_date;
	}

	public String getEnd_date() {
		return end_date;
	}

	public void setEnd_date(String end_date) {
		this.end_date = end_date;
	}

	public String getStationId() {
		return stationId;
	}

	public void setStationId(String stationId) {
		this.stationId = stationId;
	}

	public void setAiringId(String airingid) {
		this.airingId = airingid;
	}

	public String getAiringId() {
		return airingId;
	}

	public String toString() {
		StringBuffer strbuffer = new StringBuffer();
		strbuffer.append("{");
		strbuffer.append("\"id\"" + ":" + "\"" + id + "\"");
		strbuffer.append(",");
		strbuffer.append("\"airingId\"" + ":" + "\"" + airingId + "\"");
		strbuffer.append(",");
		strbuffer.append("\"programId\"" + ":" + "\"" + programId + "\"");
		strbuffer.append(",");
		strbuffer.append("\"title\"" + ":" + "\"" + title + "\"");
		strbuffer.append(",");
		strbuffer.append("\"description\"" + ":" + "\"" + description + "\"");
		strbuffer.append(",");
		strbuffer.append("\"rating\"" + ":" + "\"" + rating + "\"");
		strbuffer.append(",");
		strbuffer.append("\"startRatring\"" + ":" + "\"" + startRatring + "\"");
		strbuffer.append(",");
		strbuffer.append("\"episodeNumber\"" + ":" + "\"" + episodeNumber + "\"");
		strbuffer.append(",");
		strbuffer.append("\"altSeries\"" + ":" + "\"" + altSeries + "\"");
		strbuffer.append(",");
		strbuffer.append("\"episodeTitle\"" + ":" + "\"" + episodeTitle + "\"");
		strbuffer.append(",");
		strbuffer.append("\"seasonNumber\"" + ":" + "\"" + seasonNumber + "\"");
		strbuffer.append(",");
		strbuffer.append("\"recommendationId\"" + ":" + "\"" + recommendationId + "\"");
		strbuffer.append(",");
		strbuffer.append("\"original_air_date\"" + ":" + "\"" + originalAirDate + "\"");
		strbuffer.append(",");
		strbuffer.append("\"stationChannel\"" + ":" + "\"" + stationChannel + "\"");
		strbuffer.append(",");
		strbuffer.append("\"stationId\"" + ":" + "\"" + stationId + "\"");
		strbuffer.append(",");
		strbuffer.append("\"duration\"" + ":" + "\"" + duration + "\"");
		strbuffer.append(",");
		strbuffer.append("\"tv_rating\"" + ":" + "\"" + tvRating + "\"");
		strbuffer.append(",");
		strbuffer.append("\"genre\"" + ":" + "\"" + genre + "\"");
		strbuffer.append(",");
		strbuffer.append("\"year\"" + ":" + "\"" + year + "\"");
		strbuffer.append(",");
		strbuffer.append("\"air_date\"" + ":" + "\"" + air_date + "\"");
		strbuffer.append(",");
		strbuffer.append("\"end_date\"" + ":" + "\"" + end_date + "\"");
		strbuffer.append(",");
		StringBuffer castArray = new StringBuffer("");
		if (cast != null) {
			for (String person : cast) {
				if ((castArray.length() > 0)) {
					castArray.append(",");
				}
				castArray.append("\"" + StringEscapeUtils.escapeJson(person) + "\"");
			}
		}
		strbuffer.append("\"cast\"" + ":" + "[" + castArray + "]");
		strbuffer.append(",");
		StringBuffer producerArray = new StringBuffer("");
		if (producer != null) {
			for (String person : producer) {
				if ((producerArray.length() > 0)) {
					producerArray.append(",");
				}
				producerArray.append("\"" + StringEscapeUtils.escapeJson(person) + "\"");
			}
		}
		strbuffer.append("\"writer\"" + ":" + "[" + producerArray + "]");
		strbuffer.append("}");

		return strbuffer.toString();
	}

	public static String SQL_Query_Program_Guide = "SELECT station_channel.station_channel_id, station_channel.station_id, "
			+ "program.program_id, program.external_identifier, program_title.title, schedule.air_date, "
			+ "schedule.end_date, schedule.tv_rating, program.year, program.description, alt_series_id " + "FROM station_channel, program_title, schedule, program "
			+ "WHERE schedule.program_id = program.program_id AND program.program_title_id = program_title.program_title_id "
			+ "AND schedule.station_channel_id = station_channel.station_channel_id " + "AND station_channel.station_channel_id IN ({ChannelList}) "
			+ "AND (schedule.end_date BETWEEN ('{start}') AND ('{end}') "
			+ "OR schedule.air_date BETWEEN ('{start}') AND ('{end}')) ORDER BY station_channel.station_channel_id,schedule.air_date asc";

	public static String SQL_Query_Program_Info = "SELECT p.program_id,p.external_identifier, title.title, "
			+ "p.description, p.year,p.mpaa_rating, p.star_rating,p.episode_number, p.alt_series_id, "
			+ "p.episode_title, p.season_number, p.recommendation_id, p.original_air_date, " + "schedule.duration,schedule.station_channel_id, schedule.tv_rating "
			+ "FROM program p, program_title title, schedule WHERE p.external_identifier=\"{ProgramId}\" "
			+ "AND p.program_title_id=title.program_title_id AND p.program_id=schedule.program_id "
			+ "group by p.program_id,p.external_identifier, title.title, p.description, p.year,p.mpaa_rating, "
			+ "p.star_rating,p.episode_number, p.alt_series_id, p.episode_title, p.season_number, p.recommendation_id, "
			+ "p.original_air_date, schedule.duration,schedule.station_channel_id, schedule.tv_rating LIMIT 1";

	public static String SQL_Query_Cast = "SELECT cast_person.first_name, cast_person.last_name, cast_role.cast_role " + "FROM cast_person, castcredit, program, cast_role "
			+ "WHERE cast_person.cast_person_id = castcredit.cast_person_id " + "AND program.program_id = castcredit.program_id "
			+ "AND cast_role.cast_role_id = castcredit.cast_role_id " + "AND cast_role.cast_role in (\"Actor\",\"Producer\") "
			+ "AND program.external_identifier = \"{ProgramId}\";";

	public static String[] TABLE_INDEX = { "program_index ON program (program_id)", "program_index2 on program (external_identifier)",
			"program_index3 on program (program_title_id)", "cast_person_index on cast_person (cast_person_id)", "cast_role_index on cast_role (cast_role_id)",
			"castcredit_index on castcredit (cast_person_id)", "castcredit_index2 on castcredit (cast_role_id)", "castcredit_index3 on castcredit (program_id)",
			"program_title_index on program_title (program_title_id)", "schedule_index on schedule (program_id)", "schedule_index2 on schedule (station_channel_id)",
			"station_channel_index on station_channel (station_channel_id)" };

	public static void main(String[] args) {
		Date date = new Date(Long.parseLong("1423090800") * 1000);
		Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
		calendar.setTime(date);
		// 2015-02-04T00:00:00.000Z
		StringBuilder str = new StringBuilder();
		str.append(calendar.get(Calendar.YEAR));
		str.append("-");
		str.append((calendar.get(Calendar.MONTH) + 1) < 10 ? "0" + (calendar.get(Calendar.MONTH) + 1) : (calendar.get(Calendar.MONTH) + 1));
		str.append("-");
		str.append((calendar.get(Calendar.DAY_OF_MONTH)) < 10 ? "0" + (calendar.get(Calendar.DAY_OF_MONTH)) : (calendar.get(Calendar.DAY_OF_MONTH)));
		str.append("-");
		str.append("T");
		str.append((calendar.get(Calendar.HOUR_OF_DAY)) < 10 ? "0" + (calendar.get(Calendar.HOUR_OF_DAY)) : (calendar.get(Calendar.HOUR_OF_DAY)));
		str.append(":");
		str.append((calendar.get(Calendar.MINUTE)) < 10 ? "0" + (calendar.get(Calendar.MINUTE)) : (calendar.get(Calendar.MINUTE)));
		str.append(":");
		str.append((calendar.get(Calendar.SECOND)) < 10 ? "0" + (calendar.get(Calendar.SECOND)) : (calendar.get(Calendar.SECOND)));
		str.append(".000Z");
		System.out.println(str.toString());

	}

}