/** Copyright 2012-2013  ARRIS Group, Inc. All rights reserved. */

/**
  * (Moxi Web Utilities(MWU) class containing static helper methods for the browser.  This includes:
  * - Moxi Remote control button to JavaScript keycode mapping on the MP
  * - Accessing URL parameters
  *
  * @class
  * @this {MWU} 
  */
 
var MWU = {};
 
 /**
  *  Enumerated type of remote control keys
  * <br /><br />
  * MWU.REMOTEKEY.UP <br />
  * MWU.REMOTEKEY.DOWN <br />
  * MWU.REMOTEKEY.LEFT <br />
  * MWU.REMOTEKEY.RIGHT <br />
  * MWU.REMOTEKEY.OK <br />
  *
  * MWU.REMOTEKEY.ZERO <br />
  * MWU.REMOTEKEY.ONE <br />
  * MWU.REMOTEKEY.TWO <br />
  * MWU.REMOTEKEY.THREE <br />
  * MWU.REMOTEKEY.FOUR <br />
  * MWU.REMOTEKEY.FIVE <br />
  * MWU.REMOTEKEY.SIX <br />
  * MWU.REMOTEKEY.SEVEN <br />
  * MWU.REMOTEKEY.EIGHT <br />
  * MWU.REMOTEKEY.NINE <br />
  
  * MWU.REMOTEKEY.BACK <br />
  * MWU.REMOTEKEY.NEXT <br />
  * 
  * @static
  * @public
  * @return { MWU.KEY } keycode associated with the remote control key
  */

ESPIAL_KEY = {
		  
		   UP          :38,
		   DOWN        :40,
		   LEFT        :37,
		   RIGHT       :39,
		   OK          :13,

		   ZERO        :48,
		   ONE         :49,
		   TWO         :50,
		   THREE       :51,
		   FOUR        :52,
		   FIVE        :53,
		   SIX         :54,
		   SEVEN       :55,
		   EIGHT       :56,
		   NINE        :57,

		   BACK        :1103,
		   NEXT        :1106,

		   WINDOWKEY_PAUSE  :  19,
		   WINDOWKEY_STOP   : 413,
		   WINDOWKEY_PLAY   :414,
		   WINDOWKEY_REWIND :1104,
		   WINDOWKEY_FF     :1105

		};

CHROME_KEY = {
		  
		   UP          :38,
		   DOWN        :40,
		   LEFT        :37,
		   RIGHT       :39,
		   OK          :13,

		   ZERO        :48,
		   ONE         :49,
		   TWO         :50,
		   THREE       :51,
		   FOUR        :52,
		   FIVE        :53,
		   SIX         :54,
		   SEVEN       :55,
		   EIGHT       :56,
		   NINE        :57,

		   BACK        :66,
		   NEXT        :1106,

		   WINDOWKEY_PAUSE  :  80,
		   WINDOWKEY_STOP   : 27,
		   WINDOWKEY_PLAY   :32,
		   WINDOWKEY_REWIND :37,
		   WINDOWKEY_FF     :39

		};

if(navigator.appVersion.indexOf("Chrome")>0){
    MWU.REMOTEKEY = CHROME_KEY
}else{
    MWU.REMOTEKEY = ESPIAL_KEY;
}

/**
 * Gets the remote control button that cooresponds with the JavaScript keycode
 * @public
 * @static
 * @param {numeric} JavaScript keycode
 * @return {string} The remote control key that cooresponds to the JavaScript keycode
 */

MWU.getRemoteKeyName = function(code) {
   
	var KEYSTRING = {
	38 : "UP",
	40 : "DOWN",
	37 : "LEFT",
	39 : "RIGHT",
	13 : "OK",
	48 : "ZERO",
	49 : "ONE",
	50 : "TWO",
	51 : "THREE",
	52 : "FOUR",
	53 : "FIVE",
	54 : "SIX",
	55 : "SEVEN",
	56 : "EIGHT",
	57 : "NINE",
  1103 : "BACK",
  1106 : "NEXT",
  19:  "WINDOWKEY_PAUSE",
  413: "WINDOWKEY_STOP" ,
  414: "WINDOWKEY_PLAY",
  1104: "WINDOWKEY_REWIND",
  1105: "WINDOWKEY_FF"    
  }
  
  var result = KEYSTRING[code];
  if (result == undefined) result = code;
  return result;

};    
    
	 
/**
 * Returns the value of the param key in the page's URL parameter
 * @public
 * @static
 * @param {string} key the parameter key
 * @return {string} the value of the param key
 */ 
MWU.getUrlParam = function( key ) {
  var key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regex = new RegExp( "[\\?&]"+key+"=([^&#]*)"  );
  var results = regex.exec( window.location.href );
  return ( results == null ) ? null : results[1];
}

/**
 * Read a page's URL parameters and return param:value as an associative array
 * @public
 * @static
 * @return {assocative array} mapping all the params to their value
 */
MWU.getUrlParamsColl = function(){
    var vars = [], hash;
	 var href= window.location.href;
    var hashes = href.slice(href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++){
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}


 






