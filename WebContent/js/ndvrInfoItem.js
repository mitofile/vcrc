function NDVRInfoItem(id, mws_dvr_task_id, title, rate, img_title, sinopsys, img_src_poster, img_channel_logo, channel_number, date, start_date, end_date, air_date, playbackUrl, cast) {
	
	this.id = id;
	this.mws_dvr_task_id = mws_dvr_task_id;
	this.rate = rate,
	this.img_title = img_title;
	this.sinopsys = sinopsys;
	this.img_src_poster = img_src_poster;
	this.img_channel_logo = img_channel_logo;
	this.channel_number = channel_number;
	this.date = getSimpleDate(date, 'DD, mm/d');
	this.start_date = getSimpleDate(start_date, 'hh:mm');
	this.end_date = getSimpleDate(end_date, 'hh:mm ampm');
	this.air_date = getSimpleDate(air_date, 'mm/dd/yy');
	this.playbackUrl = playbackUrl;
	this.cast = cast;
 	
	
	function getSimpleDate(date, format){
	 var result = null;
	 var formatted = new Date(date * 1000 );
	 switch (format) {
		case 'hh:mm':
			var hours = null;
		     var suffix = null;
		     var minutes =  ((formatted.getMinutes()<=9)?"0"+formatted.getMinutes():formatted.getMinutes())
		     hours = formatted.getHours();
	         suffix = (hours < 12) ? 'am' : 'pm';
	         hours = hours % 12 || 12;   
	         hours = (hours<9)?"0" + hours : hours;
		     result = hours + ":" + minutes;
			break;
		case 'hh:mm ampm':
			 var hours = null;
		     var suffix = null;
		     var minutes =  ((formatted.getMinutes()<=9)?"0"+formatted.getMinutes():formatted.getMinutes())
		     hours = formatted.getHours();
	         suffix = (hours < 12) ? 'am' : 'pm';
	         hours = hours % 12 || 12;   
	         hours = (hours<9)?"0" + hours : hours;
	         result = hours + ":" + minutes + " " + suffix;
			break;
		default:
			result = $.datepicker.formatDate(format, formatted)
			break;
	}
	 return result;
	}
	

	// function privateMethod() { .. }

	// // public methods
	// that.add = function(b) {
	// return a + b;
	// };

}





