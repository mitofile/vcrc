function handleError(callbak){
	var fatalError = false;
	var errorMsg = undefined;
	switch (window.params.player.networkState()) {
	case 1:
		fatalError = true;
		errorMsg = "ERROR: Streaming Aborted";
		break;
	case 2:
		fatalError = true;
		errorMsg = "ERROR: Network or Manifest problem";
		break;
	case 3:
		fatalError = true;
		errorMsg = "ERROR: Decode error";
		break;
	case 4:
		fatalError = true;
		errorMsg = "ERROR: Source is not supported";
		break;

	default:
		break;
	}
	
	if(callbak && fatalError){
		reportMediaError(errorMsg);
		callbak();
	}
}

function reportMediaError(errorMsg){
	 var msgObj = {};
	  msgObj.msg= "Media Error: " + errorMsg;
	  msgObj.className = "dataMonitorMsg";
	  reportActivity(msgObj);
	  var mediaError = window.params.player.errorDisplay.player().error();
	  mediaError.monitor ={'player' : 'Getting media playback'};
      informErrorActivity(mediaError);
	  //Test Monitor------------------------------
}