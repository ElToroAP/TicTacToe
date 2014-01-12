function NetworkClass() {
	this.GET = function(url, response) {
		this.makeCallJSON(url, "GET", null, response);	
	}
	this.POST = function(url, body, response) {
		this.makeCallJSON(url, "POST", body, response);
	}
	this.makeCall = function(url, type, jsonData, response) {
		$.ajax({
			url : url, type: type, data : jsonData, cache: false, async: true,
			success : function(callback) { response(callback); },
			error : function(callback) { board.networkFailure(callback); }
		});
	}
	this.makeCallJSON = function(url, type, jsonData, response) {
		$.ajax({
			url : url, type: type, data : jsonData, cache: false, async: true,
			success : function(callback) { response(callback); },
			error : function(callback) { board.networkFailure(callback); },
			headers: {
               'Authorization': 'OAuth ' + sfdc.sessionID,
               'Accept': 'application/json',
               'Content-Type': 'application/json'
            },
			contentType: "application/json; charset=utf-8", dataType: "json"
		});
	}
	
	// TEST METHODS
	this.makeData = function() {
		var data = {};
		data["input"] = "Now: " + Date.now();
		return data;
	}
	this.testGET = function() {
		var url = "http://localhost:8080/test/get?test=" + this.makeData().input;
		return this.GET(url, new testResponseClass());
	}
	this.testPOST = function() {
		var url = "http://localhost:8080/test/post";
		var body = JSON.stringify(this.makeData());
		return this.POST(url, body, new testResponseClass());
	}
	function testResponseClass() {
		this.success = function(callback) {
			alert("Success-2: " + callback.output);
			alert("Board: " + board.currentState.stateName);
		}
		this.failure = function(callback) {
			alert("Error-2: " + callback);
		}
	}
}
