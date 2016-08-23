function NdvrSeries(id, seriesId, state, title, poster, type, options, episodes) {
	this.episodes = [];
	this.id = id;
	this.seriesId = seriesId;
	this.state = state;
	this.title = title;
	this.url_img_poster = poster;
	this.content_type = "SubscriberSeriesRecording";
	this.type = type;
	options.endOffset = options.endOffset + ".0";
	options.startOffset = options.startOffset + ".0";
	this.options = options;
}

