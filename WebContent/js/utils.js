function getSimpleDate(date, format) {
	var result = null;
	var formatted = new Date(date * 1000);
	switch (format) {
	case 'hh:mm':
		var hours = null;
		var suffix = null;
		var minutes = ((formatted.getMinutes() <= 9) ? "0"
				+ formatted.getMinutes() : formatted.getMinutes())
		hours = formatted.getHours();
		suffix = (hours < 12) ? 'am' : 'pm';
		hours = hours % 12 || 12;
		hours = (hours < 9) ? "0" + hours : hours;
		result = hours + ":" + minutes;
		break;
	case 'hh:mm ampm':
		var hours = null;
		var suffix = null;
		var minutes = ((formatted.getMinutes() <= 9) ? "0"
				+ formatted.getMinutes() : formatted.getMinutes())
		hours = formatted.getHours();
		suffix = (hours < 12) ? 'am' : 'pm';
		hours = hours % 12 || 12;
		hours = (hours < 9) ? "0" + hours : hours;
		result = hours + ":" + minutes + " " + suffix;
		break;
	default:
		result = $.datepicker.formatDate(format, formatted)
		break;
	}
	return result;
}

function getTimeStamp(dateStr, offsetVal) {
	var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})"
			+ "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?"
			+ "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
	var d = dateStr.match(new RegExp(regexp));

	var offset = 0;
	var date = new Date(d[1], 0, 1);

	if (d[3]) {
		date.setMonth(d[3] - 1);
	}
	if (d[5]) {
		date.setDate(d[5]);
	}
	if (d[7]) {
		date.setHours(d[7]);
	}
	if (d[8]) {
		date.setMinutes(d[8]);
	}
	if (d[10]) {
		date.setSeconds(d[10]);
	}
	if (d[12]) {
		date.setMilliseconds(Number("0." + d[12]) * 1000);
	}
	if (d[14]) {
		offset = (Number(d[16]) * 60) + Number(d[17]);
		offset *= ((d[15] == '-') ? 1 : -1);
	}

	if (offsetVal) {
		offset -= date.getTimezoneOffset();
		time = (Number(date) + (offset * 60 * 1000));
		return (Number(time)) / 1000;
	} else {
		// offset -= date.getTimezoneOffset();
		// time = (Number(date) + (offset * 60 * 1000));
		return (Number(date)); // return formatted date same that nDvr (GMT)
	}
}
