  function NdvrCatchup(value) {
	this.content_type = CONSTANTS.CATCHUP_CONTENT_TYPE;
	this.type = value.type;
	this.channels = value.channels;
	this.id = value.id;
	this.name = value.name;
	this.start = value.createdOn;
	this.status = value.status;
	this.scope = value.scope;
	this.recordings = value.recordings;
	if(value.options && value.options.retentionHours){
		this.retention = value.options.retentionHours
	}else{
		this.retention = undefined;
	}
}

NdvrCatchup.prototype.isInCatchupPeriod = function(obj){
	
	var now = new Date();
	var endDate = new Date();
	endDate.setHours(now.getHours() - this.retention);
	var elementEnd = new Date(Date.parse(obj.end));
	var elementStart = new Date(Date.parse(obj.start));
	var recordingSet_start = new Date(Date.parse(this.start));
	var recordingSet_end = undefined;

	return ((elementEnd > endDate) && (elementStart <= now)) && (elementStart >= recordingSet_start);
};
