function createMonitorDialog(position){
	  if (window.params.test && window.params.test === "true") {
		$(function() {
			$("#testMonitor").dialog({
				height : (screen.height * 0.35),
				width : '800',
				minHeight: '150',
				minWidth: '500',
				display : 'block',
				resizable : true,
				overflow: scroll,
				position : [ (screen.width * position.x), (screen.height * position.y) ]
			});
			var divTitleBar = $('.ui-dialog-titlebar.ui-widget-header.ui-corner-all.ui-helper-clearfix')[0];
			if (divTitleBar) {
				var span = $(divTitleBar).find('span');
				span.attr('style', 'width:25%;');

				var divTools = document.createElement("div");
				divTools.style.float = "right";
				divTools.style.paddingRight = "2%";

				divTitleBar.appendChild(divTools);
				
				var Transparentbutton = document.createElement('a');
				    Transparentbutton.className = "btn btn-info transparentButtonOff";
				    Transparentbutton.innerHTML = "Transparent";
				    Transparentbutton.id = "transparentButton";
				  $(Transparentbutton).bind('click', function() {
					var buttonTransparent = $('#transparentButton');
				    if( buttonTransparent.hasClass("transparentButtonOff")){
				    	buttonTransparent.removeClass("transparentButtonOff");
				    	buttonTransparent.addClass('transparentButtonOn');
				    	$('[aria-describedby=testMonitor]').css("opacity", "0.5");
				    }else{
				    	buttonTransparent.removeClass("transparentButtonOn");
				    	buttonTransparent.addClass('transparentButtonOff');
				    	$('[aria-describedby=testMonitor]').css("opacity", "1");
				    }
				  });
				  divTitleBar.appendChild(Transparentbutton);
				
				
				
				
				var divDropDownButton = $('<div/>')
				.addClass('btn-group')
				.attr("style","float:right;margin-right:50px;")
				.appendTo(divTitleBar);
				var button = $('<button/>')
				.attr('type', "button")
				.attr('data-toggle', "dropdown")
				.attr('aria-expanded', "false")
				.addClass('btn btn-default dropdown-toggle')
				.html("Action")
				.appendTo(divDropDownButton);
				var span = $('<span/>')
				.addClass('caret')
				.appendTo(button);
				var option = $('<ul/>')
				.addClass('dropdown-menu')
				.attr('role', "menu")
				.appendTo(divDropDownButton);
				if(window.configGuide.monitorTool.length>0){
					$.each(window.configGuide.monitorTool, function( index, value ) {
						addAction(option, value.title, value.action);
					});	
				}else{
					button.prop('disabled', true);
				}
				$(".ui-widget-content").css("background-color", "#000");
			}
			var monitorBody = $(".ui-draggable")[0];
			var buttonContainer = document.createElement('div');
			buttonContainer.id = "buttonContainer";
			buttonContainer.style.right = "0px";
			buttonContainer.style.position = "absolute";
			buttonContainer.style.bottom = "1%";
			addButton("Clear", buttonContainer, "btn btn-info", clearMonitor);
			//addButton("Save", buttonContainer, "btn btn-info", createTestFile);
			monitorBody.appendChild(buttonContainer);
			window.scrollLock = false;
		});
		$("#testMonitor").on('resize', function (){
			$("#testMonitor").css("width","100%");
			console.log("tamaño cambiado!!!!!!")
		});
	}
}

function addAction(option, actionName, action){
	var li = $('<li/>')
	.appendTo(option);
	var a = $('<a/>')
	.attr('href', "#")
	.html(actionName);
	 $(a).bind('click', function() {
		window[action]();
	 });
	$(a).appendTo(li);
	
}

function addCombo(name, divTools, className, action, options) {
	var combo = document.createElement('select');
	var labelCombo = document.createElement('label');
	labelCombo.innerHTML = name;
	combo.id = name
	$.each(options, function( index, value ) {
		var optionValue = document.createElement('option');  
		optionValue.innerHTML = value.title;
		combo.appendChild(optionValue);
	});

	$(combo).change(function() {
	    switch ($(this).val()) {
		case 'Components Endpoint':
			showEndpoints();
			break;
		case 'Recordable Channels':
		    showRecordableChannels();
		    break;
		case 'Force Play':
			forcePlay();
		    break;
		default:
			break;
		}
	});
	
	$(combo).hover(
		    function(){
		        $("#testMonitor").dialog('option', 'draggable', false);
		    },
		    function(){
		        $("#testMonitor").dialog('option', 'draggable', true);
		    }
		);
	
	//$(combo).selectmenu();
	
//	$(combo).bind('click', function() {
//		action();
//	});
	divTools.appendChild(labelCombo);
	divTools.appendChild(combo);
}


function forcePlay(){
	window.configGuide.infoScreenConfig.menuItem[1].menuActions.push({title: "Watch", action: "preview", show_wasEmitted:true})
}

function addButton(name, divTools, className, action){
  var button = document.createElement('a');
  button.className = className;
  button.innerHTML = name;
  button.id = name;
  button.style.backgroundColor= "rgba(255, 255, 255, 0)";
  button.style.color = "#46b8da";
  button.style.float = "right";
  if(name === "Clear"){
	  button.style.marginRight= "25px";
  }
  $(button).bind('click', function() {
    action();
  });
  divTools.appendChild(button);
}


function getIdInfo(id, component){
    var msgObj = {};
    msgObj.className = "dataMonitorMsg";
    msgObj.msg= "Getting ID Information: " + id;
	reportActivity(msgObj);
	var msg = {};
	msg.actionService ="GET_ID";
	msg.id=id;
	msg.component=component;
	msg.subscriber = window.params.subscriberName;
	var deferred = requestInfo(msg)
	$.when(deferred).done(function(data) {
	  var sendMsgObj = {};
      sendMsgObj.json = data.idObj;
      sendMsgObj.label = "GET ID"
      reportActivity(sendMsgObj);
	});	
}

function sendGetUri(uri){
    var msgObj = {};
    msgObj.className = "dataMonitorMsg";
    msgObj.msg= "Getting URI Information: " + uri;
	reportActivity(msgObj);
	var msg = {};
	msg.actionService ="GET_URI";
	msg.uri=uri;
	msg.subscriber = window.params.subscriberName;
	var deferred = requestInfo(msg)
	$.when(deferred).done(function(data) {
	  var sendMsgObj = {};
      sendMsgObj.json = data.uriObj;
      sendMsgObj.label = "Get Uri"
      reportActivity(sendMsgObj);
	});	
}



function showRecordableChannels(){
	var msg = {};
	msg.actionService ="SHOWRECORDABLECHANNELS";
	msg.subscriber = window.params.subscriberName;
	var deferred = requestInfo(msg)
	$.when(deferred).done(function(data) {
	  clearMonitor();
	  var sendMsgObj = {};
      sendMsgObj.json = data.Channels;
      sendMsgObj.label = "Channels"
      reportActivity(sendMsgObj);
	});	
}

function showEndpoints(){
	  var msg = {};
	  msg.actionService = "SHOWENPOINTS";
	  msg.subscriber = window.params.subscriberName;
	  var deferred = requestInfo(msg);
	  $.when(deferred).done(function(data) {
	    clearMonitor();
	    var msgObj = {};
        msgObj.className = "dataMonitorMsg";
        msgObj.msg= "CIS: " +  data.CIS;
        reportActivity(msgObj);
	    var msgObj = {};
        msgObj.className = "dataMonitorMsg";
        msgObj.msg= "CS: " +  data.CS;
        reportActivity(msgObj);
	    var msgObj = {};
        msgObj.className = "dataMonitorMsg";
        msgObj.msg= "FM: " +  data.FM;
        reportActivity(msgObj);
	  });	
}

function clearMonitor(){
  clearInterval(window.logReader);
  window[window.serverName + 'Pointer'] = -1;
  $("#testMonitor").empty();
}


function scrollDown(){
	var wtf = $('#testMonitor');
	var height = wtf[0].scrollHeight;
	wtf.scrollTop(height);
}

function informErrorActivity(err){
  //Test Monitor
  var errorMsgObj = {};
  var sendMsgObj = {};
  
  sendMsgObj.label = "Sent"
  sendMsgObj.json = err.monitor;
  if(err.ERROR && !err.type){
	  errorMsgObj.msg = "Error Request: " + err.ERROR;
	  errorMsgObj.type = "error";
	  if(err.monitor){
		 delete err.monitor; 
	  }
  }else{
	  if(err.monitor){
		 delete err.monitor; 
	  }
	  errorMsgObj.label = "Error";
	  errorMsgObj.json = err.ERROR;
	  errorMsgObj.type = "error_obj";
  }
  reportActivity(errorMsgObj);	
  reportActivity(sendMsgObj);
  //Test Monitor--------------------------------
}

function informSuccessActivity(data){
  //Test Monitor
	var responseHeader = {};
  if(data.monitor && data.monitor.responseHeader){
	  var responseHeader = data.monitor.responseHeader;
	  delete data.monitor.responseHeader;
  }
  var sendMsgObj = {};
  sendMsgObj.label = "Sent"
  sendMsgObj.json = data.monitor;
  reportActivity(sendMsgObj);
  delete data.monitor;
  data.responseHeader = responseHeader;
  sendMsgObj.json = data;
  sendMsgObj.label = "Response"
  reportActivity(sendMsgObj);
  //Test Monitor-----------------------------------
}

function reportActivity(msgObj){
  if(window.params.test === "true"){
    var divContainer = document.createElement("div");
    var divClearFix = document.createElement("div");
    divClearFix.className = "clearfix";
    var textMonitor = $("#testMonitor");
    var div = document.createElement("div");
    if(msgObj.json && msgObj.type != "error"){
      div.className = "jjson dataMonitor";
      div.id="jjson" + window.jsonCounter;
      window.jsonCounter = window.jsonCounter + 1;
    }
    if(msgObj.label){
      var label = document.createElement("label");
      if(msgObj.label != "Error"){
          label.className = "lableMonitor";  
      }else{
    	  label.className = "lableErrorMonitor"; 
      }
      label.innerHTML = msgObj.label;
      divContainer.appendChild(label);
    }
    divContainer.appendChild(div);
    textMonitor.append(divContainer);
    if((msgObj.json && msgObj.type != "error") || msgObj.type == "error_obj"){
      if(msgObj.label === "Sent" || msgObj.label === "Response" || msgObj.label === "Error"){
        var divHide = document.createElement("div");
        divHide.id = "hiddenDiv";
        divHide.style.display = "none";
        divContainer.appendChild(divHide);
      }
      $("#" + div.id).jJsonViewer(msgObj.json);
    }else{
   		div.innerHTML = msgObj.msg;
    }
    if(msgObj.className){
        div.className = msgObj.className; 
    }
    div.className=(msgObj.type=="error")?"errorMonitor":div.className;
    divContainer.appendChild(divClearFix);
  }
  scrollDown();
}

function createTestFile(){
  var msg = {};
  msg.actionService = "CREATEFILE";
  msg.subscriber = window.params.subscriberName;
  var item = [];
  var data = $("#testMonitor").find('[id=hiddenDiv]');
  $.each(data,function(i,value) {
     value = value.innerHTML.replace(new RegExp('\"', 'g'), "'");
     value = value.replace(/\\/g,'');
     value = value.replace(/'/g,'"');
     value = value.replace(/"{/g,'{');
     item.push(value);
   });
  msg.item = item;
  var deferred = requestInfo(msg);
  $.when(deferred).done(function(data) {
    clearMonitor();
  });
}

function requestInfo(msg) {
    return $.ajax({
    async : true,
    type : "POST",
    url : "MonitorService",
    contentType : 'application/json',
    mimeType : 'application/json',
    data : JSON.stringify(msg)
  });
}

function readLog(serverName) {
  window.serverName = serverName;
  clearMonitor();
  window.scrollLock = false;
  doRead(serverName);
  window.logReader = setInterval(function() {
    doRead(serverName);
  }, 2000);
}

function doRead(serverName){
  var msg = {};
  msg.actionService = "READLOG";
  msg.serverName = serverName;
  if(!window[serverName + 'Pointer']){
    window[serverName + 'Pointer'] = -1;
  }
  msg.pointer = window[serverName + 'Pointer'];
  var deferred = getLog(msg);
  $.when(deferred).done(function(data) {
    for(var i=0;i<data.line.length;i++){
      var msgObj = {};
      msgObj.className = "dataMonitorMsg";
      msgObj.msg= data.line[i];
      reportActivity(msgObj);
      setTimeout(function(){
        if(!window.scrollLock){
          var wtf = $('#testMonitor');
          var height = wtf[0].scrollHeight;
          wtf.scrollTop(height);
        }
      }, 0);
    }
    window[serverName + 'Pointer'] = data.pointer;
  });
}

function getLog(msg){
  return $.ajax({
    async : true,
    type : "POST",
    url : "MonitorService",
    contentType : 'application/json',
    mimeType : 'application/json',
    data : JSON.stringify(msg)
  });
}
