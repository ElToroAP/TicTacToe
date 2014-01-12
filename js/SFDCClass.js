function SFDCClass() {
	this.sessionID = null;
	this.serverURL = null;
	
    // Salesforce.com Login
	this.serverConnect = function() {
		if (this.sessionID == null) {
			// OAuth 2.0 Username-Password Flow
			// https://help.salesforce.com/help/doc/en/remoteaccess_oauth_username_password_flow.htm
			var consumerKey = "3MVG98XJQQAccJQee_FqRTNSUDu2ncV6fqYlwXe6J3uV1iqKkVPCcVzf5EkewILlAgn1s05vG4hW.tWo23Sct";
			var ConsumerSecret = "6081151473803404988";
			var username = "aperez@games.com";
			var password = "sfdc1234";
            
			var url = "https://login.salesforce.com/services/oauth2/token";
			var body = "";
			body += "grant_type" + "=" + "password" + "&";
			body += "client_id" + "=" + consumerKey + "&";
			body += "client_secret" + "=" + ConsumerSecret + "&";
			body += "username" + "=" + username + "&";
			body += "password" + "=" + password + "&";
			body += "format" + "=" + "json";
            util.addLog("Logging in");
			var net = new NetworkClass();
			net.makeCall(url, "POST", body, this.serverConnectHandler);
		} else {
			board.currentState.loginOK();
		}
	}
    this.serverConnectHandler = function(callback) {
        sfdc.sessionID = callback.access_token;
        sfdc.serverURL = callback.instance_url;
        util.addLog("Logged in. SessionID: " + sfdc.sessionID);
        util.hidePleaseWait();
        board.currentState.changeState();
    }

    // Sign in
    this.signIn = function() {
        var url = sfdc.serverURL + "/services/apexrest/games/singIn";
        var data = {};
        data.input = {};
        data.input["username"] = $("#signInUsername").val();
        data.input["password"] = $("#signInPassword").val();
        var body = JSON.stringify(data);
        var net = new NetworkClass();
        net.POST(url, body, this.signInHandler);
    }
	this.signInHandler = function(callback) {
        if (callback.error != null) {
            alert(callback.error);
            util.addLog("Failed to sign in: " + callback.error);
            board.changeState(new SignInClass());
        } else {
            board.playerID = callback.recordID;
            board.username = callback.username;
            util.addLog("Player ID: " + board.playerID);
            board.currentState.changeState();
        }
    }
    
    // Find friend and Asycn wait (unless it is detected on the value returned, then jump directly without waiting)
    this.findFriend = function() {
        var url = sfdc.serverURL + "/services/apexrest/games/findFriend";
        var data = {};
        data.input = {};
        data.input["playerID"] = board.playerID;
        var body = JSON.stringify(data);
        var net = new NetworkClass();
        net.POST(url, body, this.findFriendHandler);
    }
    this.findFriendHandler = function(callback) {
        if (callback.error != null) {
            $("#pageFindPlayerMessage").html(callback.error);
            util.addLog(callback.error);
            // Wait for Streaming API event.
            sfdc.waitFriendRegisters();
        } else {
            sfdc.friendFound(callback.player1, callback.player2, callback.gameID, callback.whosTurn);
        }
    }
    this.waitFriendRegisters = function() {
        var topicURL = "/topic/waitFriendRegisters" + "?Player1__c=='" + board.playerID + "'||Player2__c=='" + board.playerID + "'";
        $.cometd.init({
                      appendMessageTypeToURL: false,
                      url: sfdc.serverURL + "/cometd/29.0/",
                      requestHeaders: { "Authorization": "OAuth " + sfdc.sessionID }
                      });
        $.cometd.subscribe(topicURL, function(message) { sfdc.waitFriendRegistersHandler(message); });
    }
    this.waitFriendRegistersHandler = function(message) {
        $.cometd.disconnect();
        util.addLog("New Game Found!");
		util.addLog("-- Topic: " + message.channel);
		util.addLog("-- Client: " + message.clientId);
		util.addLog("-- Event created DTTM: " + message.data.event.createdDate);
		util.addLog("-- Event Type: " + message.data.event.type);
        var record = message.data.sobject;
        sfdc.friendFound(record.Player1__c, record.Player2__c, record.Id, record.WhosTurn__c);
    }
    this.friendFound = function(player1, player2, gameID, whosTurn) {
        board.gameID = gameID;
        board.whoIsPlaying = board.vX;
        if (board.playerID == whosTurn) {
            board.otherPlayerID = player2;
            board.tokenLocalPlayer = board.vX;
        } else {
            board.otherPlayerID = player1;
            board.tokenLocalPlayer = board.vO;
        }
        util.addLog("Game ID: " + board.gameID);
        util.addLog("My Token: " + board.tokenLocalPlayer);
        $("#pageGameBoardMyToken").html(board.tokenLocalPlayer);
        alert("Game is starting... You are [" + board.tokenLocalPlayer + "]");
        setTimeout(function() { board.currentState.changeState(); }, 100);
    }
    this.abortWaitFriendRegisters = function() {
	    $.cometd.disconnect();
        var url = sfdc.serverURL + "/services/apexrest/games/findFriendAbort";
        var data = {};
        data.input = {};
        data.input["playerID"] = board.playerID;
        var body = JSON.stringify(data);
        var net = new NetworkClass();
        net.POST(url, body, this.abortWaitFriendRegistersHandler);
    }
    this.abortWaitFriendRegistersHandler = function(callback) {
        board.changeState(new AskUserToStartClass());
    }
    
    // Publish Turn
    this.publishTurn = function(jsonData) {
        var url = sfdc.serverURL + "/services/apexrest/games/publishTurn";
        var data = {};
        data.input = {};
        data.input["gameID"] = board.gameID;
        data.input["playerID"] = board.playerID;
        data.input["gameOver"] = board.gameOver;
        if (board.winner == null) {
            data.input["winner"] = null;
        } else if (board.winner == board.tokenLocalPlayer) {
            data.input["winner"] = board.playerID;
        } else {
            data.input["winner"] = board.otherPlayerID;
        }
        data.input["jsonData"] = jsonData;
        var body = JSON.stringify(data);
        var net = new NetworkClass();
        net.POST(url, body, this.publishTurnHandler);
    }
	this.publishTurnHandler = function(callback) {
        if (callback.error != null) {
            // Not your turn ;-)
            alert(callback.error);
        } else {
            // The callback information is just a confirmation, don't do anything...
            // except, wait for the other player ;-)
            sfdc.waitFriendPlays();
        }
    }
    
    // Wait for other player's turn
    this.waitFriendPlays = function() {
        var topicURL = "/topic/waitFriendPlays" + "?Id=='" + board.gameID + "'&&WhosTurn__c=='" + board.playerID + "'";
        $.cometd.init({
                      appendMessageTypeToURL: false,
                      url: sfdc.serverURL + "/cometd/29.0/",
                      requestHeaders: { "Authorization": "OAuth " + sfdc.sessionID }
                      });
        $.cometd.subscribe(topicURL, function(message) { sfdc.waitFriendPlaysHandler(message); });
    }
    this.waitFriendPlaysHandler = function(message) {
        $.cometd.disconnect();
        util.addLog("New turn Found!");
        util.addLog("-- Topic: " + message.channel);
        util.addLog("-- Client: " + message.clientId);
        util.addLog("-- Event created DTTM: " + message.data.event.createdDate);
        util.addLog("-- Event Type: " + message.data.event.type);
        var record = message.data.sobject;
        board.currentState.remotePlayed(record);
    }
    this.abortWaitFriendPlays = function() {
    	$.cometd.disconnect();
        var url = sfdc.serverURL + "/services/apexrest/games/publishTurnAbort";
        var json = {};
        json["abort"] = true;
        var data = {};
        data.input = {};
        data.input["gameID"] = board.gameID;
        data.input["playerID"] = board.playerID;
        data.input["winner"] = board.otherPlayerID;
        data.input["jsonData"] = JSON.stringify(json);
        var body = JSON.stringify(data);
        var net = new NetworkClass();
        net.POST(url, body, this.abortWaitFriendPlaysHandler);
    }
    this.abortWaitFriendPlaysHandler = function(callback) {
        board.changeState(new AskUserToStartClass());
    }
}