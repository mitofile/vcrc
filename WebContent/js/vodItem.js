
function parseOndemandResponse(response,type) {
	this.recommmendedRecords = [];
	var that = this;
	$.each(response[type], function(key, value) {
		var id = value.id;
		var type = value.type;
		var title = value.title;
		var poster = "./posterImage/" + value.poster;
		var metadata = value.metadata;
		var objR = new VodItem(id, poster, type, title,metadata);
		that.recommmendedRecords.push(objR);
	})

	return this.recommmendedRecords;
}

function VodItem (id, poster, type, title,metadata) {
    this.id = id;
    this.title = title;
    this.poster = poster;
    this.type = type;
    this.metadata = metadata;
    return this;
}
