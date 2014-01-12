function UtilClass() {
	this.msgLog = "";
    
	this.randomBoolean = function() {
		return this.randomWightedTrue(50);
	}
	this.randomWightedTrue = function(weight) {
		// This returns a Boolean where <weight>% of the time is true.
		var rnd = Math.floor((Math.random()*100));
		return (rnd <= weight);
	}
	this.addLog = function(msgLog) {
		// this.msgLog += msgLog + "\n";
		// alert(msgLog);
		$("#debugContent").append(msgLog + "<br/>");
	}
	this.showLog = function () {
		alert(this.msgLog);
		this.msgLog = "";
	}
    this.showPleaseWait = function(msg) {
        $("#popupPleaseWait").popup();
        $("#popupPleaseWaitMessage").html("<i>" + msg + "</>");
        $("#popupPleaseWait").popup("open");    }
    this.hidePleaseWait = function() {
        $("#popupPleaseWait").popup("close");
    }
}
