!function($){

	"use strict";

  	$.fn.jJsonViewer = function (jjson) {
	    return this.each(function () {
	    	var self = $(this);
        	if (typeof jjson == 'string') {
          		self.data('jjson', jjson);
        	} 
        	else if(typeof jjson == 'object') {
        		self.data('jjson', JSON.stringify(jjson))
        	}
        	else {
          		self.data('jjson', '');
        	}
	      	new JJsonViewer(self);
	    });
  	};

	function JJsonViewer(self) {
		var json = $.parseJSON(self.data('jjson'));
  		self.html('<ul class="jjson-container"></ul>');
  		self.find(".jjson-container").append(json2html([json]));
	}


	function json2html(json) {
		var html = "";
		for(var key in json) {
			if (!json.hasOwnProperty(key)) {
				continue;
			}

			var value = json[key],
				type = typeof json[key];

			html = html + createElement(key, value, type);
		}
		return html;
	}

	function encode(value) {
		return $('<div/>').text(value).html();
	}

	function createElement(key, value, type) {
		var klass = "object",
        	open = "{",
        	close = "}";  
		if ($.isArray(value)) {
			klass = "array";
      		open = "[";
      		close = "]";
		}
		if(value === null) {
			return '<li><span class="key">"' + encode(key) + '": </span><span class="null">"' + encode(value) + '"</span></li>';	
		}
		if(type == "object") {
			var object = '<li><span class="expanded collapsed"></span><span class="key">"' + encode(key) + '": </span> <span class="open">' + open + '</span> <ul class="' + klass + '" style="display:none">';
			object = object + json2html(value);
			return object + '</ul><span class="close">' + close + '</span></li>';
		}
		if(type == "number" || type == "boolean") {
			return '<li><span class="key">"' + encode(key) + '": </span><span class="'+ type + '">' + encode(value) + '</span></li>';	
		}
		if(encode(key)==="uri"){
			return '<li><span class="key">"' + encode(key) + '": </span><a onclick ="sendGetUri(\'' + encode(value) + '\')" href="#"><span class="'+ type + '">"' + encode(value) + '"</span><img src="css/images/info.png" style="width: 20px; height: 20px; position:relative;bottom: 2px;left: 10px;"></a></li>';
		}else if(encode(key) === "_self"){
			return '<li><span class="key">"' + encode(key) + '": </span><a onclick ="sendGetUri(\'' + encode(value) + '\')" href="#"><span class="'+ type + '">"' + encode(value) + '"</span><img src="css/images/info.png" style="width: 20px; height: 20px; position:relative;bottom: 2px;left: 10px;"></a></li>';	
		}else if(encode(key) === "recordingId"){
			return '<li><span class="key">"' + encode(key) + '": </span><a onclick ="getIdInfo(\'' + encode(value) + '\', \'CS\')" href="#"><span class="'+ type + '">"' + encode(value) + '"</span><img src="css/images/info.png" style="width: 20px; height: 20px; position:relative;bottom: 2px;left: 10px;"></a></li>';	
		}else{
			return '<li><span class="key">"' + encode(key) + '": </span><span class="'+ type + '">"' + encode(value) + '"</span></li>';
		}
	}

	$(document).on("click", '.jjson-container .expanded', function(event) {
    	event.preventDefault();
    	event.stopPropagation();
    	$(this).addClass('collapsed').parent().find(">ul").slideUp(0);
  	});

	$(document).on('click', '.jjson-container .expanded.collapsed', function(event) {
  		event.preventDefault();
  		event.stopPropagation();
  		$(this).removeClass('collapsed').parent().find(">ul").slideDown(0);
	});
	
	

}(window.jQuery);