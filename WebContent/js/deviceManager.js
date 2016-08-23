/**
 * 
 */
//alert(screen.width);


//alert("width:" + window.screen.width);
//alert("height:" +screen.availHeight);


window.device = {};

window.device.height_fact = 1;
window.device.android = false;
window.device.iPad = false;
window.device.iPhone = false;
window.device.browser = false;

if(navigator.userAgent.match(/Android/i)){
  window.device.android = true;
  window.device.name = "Android"; 
  window.device.height_fact = 3;
}
if(navigator.userAgent.match(/iPad/i)){
  window.device.iPad = true;
  window.device.name = "iPad"; 
}
if(navigator.userAgent.match(/iPhone/i)){
  window.device.iPhone = true;
  window.device.name = "iPhone";
  window.device.height_fact = 1.7;
}
if(navigator.userAgent.match(/Windows/i)){
  window.device.browser = true;
  window.device.name = "Windows"; 
}

if(navigator.userAgent.match(/Macintosh/i)){
  window.device.browser = true;
  window.device.name = "Macintosh"; 
}

window.device.isIpad = function (){
  return window.device.iPad;
}
window.device.isIphone= function (){
  return window.device.iPhone;
}
window.device.isAndroid= function (){
  return window.device.android;
}
window.device.isBrowser = function (){
  return window.device.browser;
}
window.device.isMobile = function (){
  return window.device.isIpad() || window.device.isIphone() || window.device.isAndroid();
}
window.device.isIOS = function (){
  return window.device.isIpad() || window.device.isIphone();
}
window.device.isCelPhone = function (){
  return window.device.isAndroid() || window.device.isIphone();
}
window.device.getName= function (){
  return window.device.name;
}