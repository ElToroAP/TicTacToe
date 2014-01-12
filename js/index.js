// jquery is ready.. Wait for Cordova
$(document).ready(onJQueryReady());
function onJQueryReady() {
	document.addEventListener("deviceready", onCordovaReady, false);
}

// Phonegap is ready.
function onCordovaReady() {
	var networkState = checkConnection();
	if (networkState == Connection.NONE) {
        $("#btnMultiPlayer").addClass("ui-disabled");
    } else {
        $("#btnMultiPlayer").removeClass("ui-disabled");
	}
}

// Check conection
function checkConnection() {
	var networkState = navigator.network.connection.type;
	var states = {};
	states[Connection.UNKNOWN]  = 'Unknown connection';
	states[Connection.ETHERNET] = 'Ethernet connection';
	states[Connection.WIFI]     = 'WiFi connection';
	states[Connection.CELL_2G]  = 'Cell 2G connection';
	states[Connection.CELL_3G]  = 'Cell 3G connection';
	states[Connection.CELL_4G]  = 'Cell 4G connection';
	states[Connection.NONE]     = 'No network connection';
	
	return networkState;
}