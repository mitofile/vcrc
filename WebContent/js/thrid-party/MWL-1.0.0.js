 /** Copyright 2011-2013  ARRIS Group, Inc. All rights reserved. */
 /**
  * Create an instance of the Moxi Web Logger.  MWLogger allows for logging to
  * be outputted to a overlay over the web application.
  *
  * @constructor
  * @this {MWLogger}
  * @param {associative array} options to configure the logger
  * 
  * options property
  * <pre>
  * property    default          description
  * ------------------------------------------------------------
  * enabled       false    {true| false} if true, enable logging
  * console       false    {true| false} if true, log to window.console too
  * area                         { area_id: MWLogger.Level } define the log areas and its log level
  * overlay_max_height   200     {numeric} the max height of the logging overlay
  * overlay_min_height    10     {numeric} the min height of the logging overlay
  * </pre>
  */
 function MWLogger(options) {

   
   if (options == undefined || options.enabled == false ) return; 
  
	// set the defaults
	this.options = options;
	this.options.overlay_min_height = this.options.overlay_min_height || 10;
   this.options.overlay_max_height = this.options.overlay_max_height || 200;
	this.options.areas = this.options.areas || {
			  "ALL": MWLogger.LEVEL.INFO
			} 

   if (this.options.enabled || urlEnabled()) {
     this.init();
   }

   function urlEnabled() {
     return window.location.href.indexOf("mwl=true") > 0;
   }
 }

 /**
  * Enumerated type of logging levels
  * <br /><br />
  * MWLogger.LEVEL.INFO <br />
  * MWLogger.LEVEL.WARN <br />
  * MWLogger.LEVEL.DEBUG <br />
  * MWLogger.LEVEL.ERROR <br />
  * MWLogger.LEVEL.OFF <br />
  * 
  * @static
  * @public
  * @return { MWLogger.LEVEL } Logging level type
  */
 MWLogger.LEVEL = {
   INFO: 0,
   WARN: 1,
   DEBUG: 2,
   ERROR: 3,
   OFF: 4,
	ALL: 5
 }


MWLogger.prototype.isEnabled = function(){
	return  (this.options) ? this.options.enabled : false ;
}
 /**
  * Returns the string readable name of the level
  * @public
  * @return { string } Logging level type as string
  */
 MWLogger.prototype.getLevelString = function (level) {
   switch (level) {
     case MWLogger.LEVEL.INFO:
       return "INFO";
       break;
     case MWLogger.LEVEL.DEBUG:
       return "DEBUG";
       break;
     case MWLogger.LEVEL.WARN:
       return "WARN";
       break;
     case MWLogger.LEVEL.ERROR:
       return "ERROR";
       break;
     case MWLogger.LEVEL.OFF:
       return "OFF";
       break;
	  case MWLogger.LEVEL.ALL:
       return "ALL";
       break;
   }
 }

 /**
  * Set the logging options 
  * @public
  * @param {associative array} options The options to set the logger with
  */

 MWLogger.prototype.setOptions = function(options){
	this.options = options; 
 }
 
 /**
  * Log the error message 
  * @public
  * @param {string} message The message to log
  */
 MWLogger.prototype.error = function (message) {
   this.log(MWLogger.LEVEL.ERROR, null, message);
 }

 /**
  * Log the info message 
  * @public
  * @param {string} message The message to log
  */
 MWLogger.prototype.info = function (message) {
   this.log(MWLogger.LEVEL.INFO, null, message);
 }

 /**
  * Log the warn message 
  * @public
  * @param {string} message The message to log
  */
 MWLogger.prototype.warn = function (message) {
   this.log(MWLogger.LEVEL.WARN, null, message);
 }

 /**
  * Log the debug message 
  * @public
  * @param {string} message The message to log
  */
 MWLogger.prototype.debug = function (message) {
   this.log(MWLogger.LEVEL.DEBUG, null, message);
 }

 /**
  * Log the info message with an area key
  * @public
  * @param {string} area The area to associate log message with
  * @param {string} message The message to log
  */
 MWLogger.prototype.infoArea = function (area, message) {
   this.log(MWLogger.LEVEL.INFO, area, message);
 }

 /**
  * Log the warn message with an area key
  * @public
  * @param {string} area The area to associate log message with
  * @param {string} message The message to log
  */

 MWLogger.prototype.warnArea = function (area, message) {
   this.log(MWLogger.LEVEL.WARN, area, message);
 }

 /**
  * Log the debug message with an area key
  * @public
  * @param {string} area The area to associate log message with
  * @param {string} message The message to log
  */
 MWLogger.prototype.debugArea = function (area, message) {
   this.log(MWLogger.LEVEL.DEBUG, area, message);
 }

 /**
  * Log the error message with an area key
  * @public
  * @param {string} area The area to associate log message with
  * @param {string} message The message to log
  */
 MWLogger.prototype.errorArea = function (area, message) {
   this.log(MWLogger.LEVEL.ERROR, area, message);
 }


 MWLogger.prototype.log = function (level, area, message) {
   
	 if (this.options == undefined || this.options.enabled == false ) return; 
	
   var that = this;
   if (!allowLogging()) {
     return;
   }

   var areaMsg = (area == null) ? "  " : "[" + area + "]  ";
   var msg = getTimeStamp() + " " + areaMsg + message;

   //log to overlay
   var logDiv = document.createElement("div");
   logDiv.setAttribute("class", "log" + level);
   logDiv.innerHTML = msg;
   document.getElementById("logdiv").appendChild(logDiv);
   logDiv.scrollIntoView(true);


   var that = this;
   //output to the javascript inspector console
   if (window.console && this.options.console) {
     switch (level) {
       case MWLogger.LEVEL.DEBUG:
         console.debug(msg);
         break;
       case MWLogger.LEVEL.INFO:
         console.info(msg);
         break;
       case MWLogger.LEVEL.WARN:
         console.warn(msg);
         break;
       case MWLogger.LEVEL.ERROR:
         console.error(msg);
         break;
     }
   }

   function allowLogging() {
     if (level == MWLogger.LEVEL.ERROR) return true;
     if (level == MWLogger.LEVEL.OFF) return false;

     var logArea = that.options.areas[area];
     var logAreaLevel = (logArea == undefined) ? that.options.areas["ALL"] : logArea;
   
	  
	  if (logAreaLevel == MWLogger.LEVEL.ALL) return true;
	
	  logAreaLevel = logAreaLevel || MWLogger.LEVEL.INFO;

     switch (logAreaLevel) {
       case MWLogger.LEVEL.INFO:
         return (level == MWLogger.LEVEL.INFO);
       case MWLogger.LEVEL.WARN:
         return (level == MWLogger.LEVEL.INFO) || (level == MWLogger.LEVEL.WARN);
       case MWLogger.LEVEL.DEBUG:
         return (level == MWLogger.LEVEL.INFO) || (level == MWLogger.LEVEL.WARN) || (level == MWLogger.LEVEL.DEBUG);
         return false;
     }
   }


   function getTimeStamp() {

     var date = new Date();
     return formatTime(date.getHours()) + ":" + formatTime(date.getMinutes()) + ":" + formatTime(date.getSeconds()) + "." + getMillisSeconds();


     function formatTime(time) {
       return (time < 10) ? "0" + time : time;
     }

     function getMillisSeconds() {
       var ms = date.getMilliseconds();
       if (ms < 10) return "00" + ms;
       if (ms < 100) return "0" + ms;
       return ms;
     }
   }
 }

 MWLogger.prototype.init = function () {
   var that = this;
   createOverlayDiv();
   createCSSStyle();

   function createOverlayDiv() {
     var overlayDiv = document.createElement("div");
     overlayDiv.setAttribute('class', 'logdiv');
     overlayDiv.setAttribute('id', 'logdiv');
     overlayDiv.onclick = toggleOverlay;
     document.getElementsByTagName("body")[0].appendChild(overlayDiv);

     function toggleOverlay() {
       var height = (overlayDiv.offsetHeight == that.options.overlay_min_height) ? that.options.overlay_max_height : that.options.overlay_min_height;
       overlayDiv.style.height = height + "px";
     }
   }

   function createCSSStyle() {
     var overlayCSSStyle = document.createElement("style");
     overlayCSSStyle.type = "text/css";
     var overlayCSS = ".logdiv {display:block;position:absolute;width:100%;height:" + that.options.overlay_max_height + "px;top:0px;left:0px;overflow:hidden;font:'10px arial';color:black;background:rgba(128,255,128,0.5);textAlign:left;z-index:1000;}";
     overlayCSS += ".log" + MWLogger.LEVEL.ERROR + " {color:red;   }";
     overlayCSS += ".log" + MWLogger.LEVEL.FATAL + " {color:red;   }";
     overlayCSS += ".log" + MWLogger.LEVEL.WARN + "  {color:orange;}";
     overlayCSSStyle.appendChild(document.createTextNode(overlayCSS));
     document.getElementsByTagName("head")[0].appendChild(overlayCSSStyle);

   }
 }