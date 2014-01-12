/* Main Methods */

var sfdc = null;
var util = null;
var board = null;
function onJQueryReady() {
	// Cordova
	// document.addEventListener("deviceready", onCordovaReady, false);

	alert("Version 0.3.1");
	sfdc = new SFDCClass();
	util = new UtilClass();
	board = new BoardClass();
	board.changeState(new GameONClass());
	board.currentPage = "#pageWelcome";

	util.addLog("RESTARTED");
	board.playState();		
}

$(document).ready(onJQueryReady());

function BoardClass() {
	// Game Constants
	this.vX = 'X';
	this.vO = 'O';
	this.vNull = '-';
	
	// States
	this.currentState = null;
	this.currentPage = null;
	
	// Game variables
    this.gameID = null;
    this.username = null;
    this.playerID = null;
    this.otherPlayerID = null;
    this.isMultiplayer = null;
	this.whoIsPlaying = null; // Who is playing? player1 (vX) or player2 (vO)?
	this.tokenLocalPlayer = null; // What is my token? vX or vO?
    this.winner = null;
    this.gameOver = null;
	this.cells = null;
    this.computerTurn = null;

	this.showDebug = function() {
        $.mobile.changePage("#pageDebug", { changeHash:"false", transition:"none" });
	}
	this.hideDebug = function() {
        $.mobile.changePage(this.currentPage, { changeHash:"false", transition:"none" });
	}
	this.playState = function() {
		util.addLog("Play state: " + this.currentState.stateName);
        setTimeout(function() { board.currentState.play(); }, 100);
	}
	this.changeState = function(newState) {
		util.addLog("Change state: " + newState.stateName);
		this.currentState = newState;
		this.playState();
	}
	this.changePage = function(newPage) {
		if (newPage != this.currentPage) {
			util.addLog("Change page: " + newPage);
			this.currentPage = newPage;
			$.mobile.changePage(newPage, { changeHash:"false",transition:"none" });
        }
	}
    this.networkFailure = function(callback) {
        var msg = "HTTP Code " + callback.status + " (" + callback.statusText + ")";
        if (callback.responseText != undefined) {
            msg += ": " + callback.responseText;
        }
        util.addLog("Unexpected error connecting to server: " + msg);
        alert("Unexpected error connecting to server: " + msg);
        util.hidePleaseWait();
        this.goHome();
    }
    this.goHome = function() {
        this.changeState(new AskUserToStartClass());
    }
    this.getValueByElement = function(cell) {
        var index = cell.id.charAt(cell.id.length-1) - 1;
        var row = Math.floor(index/3);
        var col = index % 3;
        return this.cells[row][col];
    }
    this.reset = function() {
        this.gameID = null;
        this.username = null;
        this.playerID = null;
        this.otherPlayerID = null;
        this.isMultiplayer = null;
        this.whoIsPlaying = null; // Who is playing? player1 (vX) or player2 (vO)?
        this.tokenLocalPlayer = null; // What is my token? vX or vO?
        this.winner = null;
        this.gameOver = false;
        this.computerPlays = null;
        this.cells = [
                      [this.vNull,this.vNull,this.vNull],
                      [this.vNull,this.vNull,this.vNull],
                      [this.vNull,this.vNull,this.vNull]
                      ];
        for (i = 1; i <= 9; i++) {
            $("#sqr" + i)[0].childNodes[0].src = "img/-.png";
        }
	}
    this.tokenOtherPlayer = function() {
        if (this.tokenLocalPlayer == this.vX) {
            return this.vO;
        } else {
            return this.vX;
        }
    }
    this.checkWinner = function() {
        var countEmpty = 0;
        var emptyCells = [];
        
        for (var i=0;i<3;i++) {
            if (!this.gameOver) {
                var countRowX = 0;
                var countRowO = 0;
                var countColX = 0;
                var countColO = 0;
                
                for (var j=0;j<3;j++) {
                    if (this.cells[i][j] == this.vNull) {
                        countEmpty ++;
                        emptyCells.push(i+":"+j);
                    }
                    
                    countRowX += this.cells[i][j] == this.vX;
                    countRowO += this.cells[i][j] == this.vO;
                    countColX += this.cells[j][i] == this.vX;
                    countColO += this.cells[j][i] == this.vO;
                }
                if ((countRowX == 3)||(countColX == 3)) {
                    this.winner = this.vX;
                    this.gameOver = true;
                    break;
                } else if ((countRowO == 3)||(countColO == 3)) {
                    this.winner = this.vO;
                    this.gameOver = true;
                    break;
                }
            } else {
                break;
            }
        }
        if (!this.gameOver) {
            if ((this.cells[0][0] == this.cells[1][1]) && (this.cells[1][1] == this.cells[2][2]) ||
                (this.cells[2][0] == this.cells[1][1]) && (this.cells[1][1] == this.cells[0][2])) {
                if (this.cells[1][1] == this.vX) {
                    this.winner = this.vX;
                    this.gameOver = true;
                } else if (this.cells[1][1] == this.vO) {
                    this.winner = this.vO;
                    this.gameOver = true;
                }
            } else if (countEmpty == 0) {
                this.winner = this.vNull;
                this.gameOver = true;
            }
        }
        
        if (!this.isMultiplayer) {
            // What would computer play?
            if (!this.gameOver) {
                var index1 = Math.floor((Math.random()*emptyCells.length));
                this.computerTurn = new TurnClass();
                this.computerTurn.byComputer(emptyCells[index1]);
            }
        }
    }

}
function TurnClass() {
    this.row;
    this.column;
    this.token;
    this.img;
    
    this.byClick = function(cell, token) {
        this.img = cell.childNodes[0];
        var index = cell.id.charAt(cell.id.length-1) - 1;
        this.row = Math.floor(index/3);
        this.col = index % 3;
        this.token = token;
    }
    this.byComputer = function(strCell) {
        var parts = strCell.split(":");
        var r = Number(parts[0]);
        var c = Number(parts[1]);
        
        this.row = r;
        this.col = c;
        this.token = board.tokenOtherPlayer();
        this.findImage();
    }
    this.byRemote = function(record) {
        var data = JSON.parse(record.JSONData__c);
        if (data.abort == true) {
            
        } else {
            this.row = data.newMove.row;
            this.col = data.newMove.col;
            this.token = data.newMove.token;
            this.findImage();
        }
        
/* This is the data in the record....
    Id: "a01G000000DuoaQIAR"
    Player1__c: "a00G000000NORiNIAX"
    Player2__c: "a00G000000NORnzIAH"
    WhosTurn__c: "a00G000000NORnzIAH"
    GameOver__c: false
    Name: "Game-0105"
    Winner__c: null
    LastPlayed__c: "2014-01-06T03:53:34.000+0000"
    JSONData__c: "{"newMove":{"row":0,"col":0},"game":{"cells":[["X","-","-"],["-","-","-"],["-","-","-"]],"winner":null,"gameOver":false}}"
*/
    }
    this.updateBoard = function() {
        this.img.src = "img/" + this.token + ".png";
        board.cells[this.row][this.col] = this.token;
        board.checkWinner();
    }
    this.findImage = function() {
        var index = (this.row*3) + (this.col) + 1;
        this.img = $("#sqr" + index)[0].childNodes[0];
    }
}

/* State Classes */
function GameONClass() {
    this.stateName = "GameON";

	this.play = function() {
		this.changeState();
	}
	this.changeState = function() {
		board.changeState(new AskUserToStartClass());
	}
}
function AskUserToStartClass() {
    this.stateName = "AskUserToStart";

	this.play = function() {
		board.changePage("#pageWelcome");
	}
	this.changeState = function() {
		board.changeState(new ResetBoardClass());
	}
	this.userStarted = function() {
		this.changeState();
	}
}
function ResetBoardClass() {
	this.stateName = "ResetBoard";
	this.play = function() {
		board.reset();
		this.changeState();
	}
	this.changeState = function() {
		board.changeState(new SelectModeClass());
	}
}
function SelectModeClass() {
	this.stateName = "SelectMode";

    this.play = function() {
        if (checkConnection() == Connection.NONE) {
            $("#btnMultiPlayer").addClass("ui-disabled");
            this.singlePlayerSelected();
        } else {
            $("#btnMultiPlayer").removeClass("ui-disabled");
            board.changePage("#pageSelectMode");
        }
    }
	this.changeState = function() {
		var newState = null;
		if (board.isMultiplayer) {
			if (sfdc.sessionID == null) {
				newState = new ServerConnectClass();
			} else {
				newState = new SignInClass();
			}
		} else {
			newState = new ChooseTokenClass();
		} 
		board.changeState(newState);
	}
	this.singlePlayerSelected = function() {
		util.addLog("Mode Selected: Single Player");
		board.isMultiplayer = false;
		this.changeState();
	}
	this.multiPlayerSelected = function() {
		util.addLog("Mode Selected: Multi Player");
		board.isMultiplayer = true;
		this.changeState();
	}
}
function ServerConnectClass() {
    this.stateName = "ServerConnect";
	
    this.play = function() {
        util.showPleaseWait("Connecting to server");
        sfdc.serverConnect();
	}
	this.changeState = function() {
		board.changeState(new SignInClass());
	}
}
function SignInClass() {
	this.stateName = "SignIn";

	this.play = function() {
        board.changePage("#pageSignIn");
    }
	this.changeState = function(isSignedIn) {
        board.changeState(new FindPlayerClass());
	}
	this.signIn = function() {
        var un = $("#signInUsername").val();
        var pw = $("#signInPassword").val();
        if ((un != "") && (pw != "")) {
            sfdc.signIn();
        } else {
            alert("Please enter username and password");
        }
    }
    this.cancelSignIn = function() {
        util.addLog("User cancelled Sing In");
		board.goHome();
	}
}
function SignUpClass() {
	this.stateName = "SignUp";
    
	this.play = function() {
		// Pretend...
		alert("Click OK when user has Signed Up ;-)");
		this.NameChosen();
	}
	this.changeState = function() {
		board.changeState(new FindPlayerClass());
	}
	this.signedUp = function() {
		this.changeState();
	}
}
function FindPlayerClass() {
	this.stateName = "FindPlayer";

	this.play = function() {
        board.changePage("#pageFindPlayer");
        sfdc.findFriend();
    }
	this.changeState = function() {
		board.changeState(new StartGameClass());
	}
	this.PlayerFound = function() {
		this.changeState();
	}
    this.stopWaitingAsk = function() {
        if (confirm("Do you want to abort?") == true) {
            this.stopWaiting();
        }
    }
    this.stopWaiting = function() {
        sfdc.abortWaitFriendRegisters();
    }
}
function ChooseTokenClass() {
    this.stateName = "ChooseToken";

	this.play = function() {
        board.whoIsPlaying = board.vX;
        board.tokenLocalPlayer = (util.randomWightedTrue(75)) ? board.vX : board.vO;
        alert("You are: " + board.tokenLocalPlayer);
        $("#pageGameBoardMyToken").html(board.tokenLocalPlayer);
        if (board.tokenLocalPlayer == board.vO) {
            board.checkWinner();
        }
		this.changeState();
	}
	this.changeState = function() {
		board.changeState(new StartGameClass());
	}
}
function StartGameClass() {
    this.stateName = "StartGame";
    
	this.play = function() {
        board.changePage("#pageGameBoard");
        $("#pageGameBoardState").html("Game is starting");
		this.changeState();
	}
	this.changeState = function() {
        if (board.tokenLocalPlayer == board.vO) {
            board.changeState(new WaitForOtherPlayerClass());
            if (board.isMultiplayer) {
                $("#pageGameBoardState").html("Please Wait");
                sfdc.waitFriendPlays();
            }
        } else {
            board.changeState(new PlayTurnClass());
        }
	}
}
function PlayTurnClass() {
    this.playerTurn;
    this.stateName = "StartTurn";
    
	this.play = function() {
		$("#pageGameBoardState").html("Select a square");
	}
	this.changeState = function() {
        if (board.gameOver) {
            board.changeState(new AnnounceWinnerClass());
        } else {
            board.changeState(new WaitForOtherPlayerClass());
        }
	}
    this.clickHandler = function(cell) {
        if (board.getValueByElement(cell) != board.vNull) {
            alert("Please select a cell that has not been used");
        } else {
            if (board.whoIsPlaying == board.tokenLocalPlayer) {
                board.whoIsPlaying = board.tokenOtherPlayer();
                this.playerTurn = new TurnClass();
                this.playerTurn.byClick(cell, board.tokenLocalPlayer);
                this.playerTurn.updateBoard();
                if (board.isMultiplayer) {
                    // Publish and wait
                    var data = {};
                    data.newMove = {};
                    data.newMove.row = this.playerTurn.row;
                    data.newMove.col = this.playerTurn.col;
                    data.newMove.token = this.playerTurn.token;
                    data.game = {};
                    data.game.cells = board.cells;
                    data.game.winner = board.winner;
                    data.game.gameOver = board.gameOver;
                    var jsonData = JSON.stringify(data);
                    sfdc.publishTurn(jsonData);
                }
                this.changeState();
            } else {
                alert("Please wait for your turn!");
            }
        }
    }
    this.stopWaitingAsk = function() {
        if (confirm("It\'s your turn, do you really want to abort?") == true) {
            this.stopWaiting();
        }
    }
    this.stopWaiting = function() {
        sfdc.abortWaitFriendPlays();
    }
}
function WaitForOtherPlayerClass() {
    this.otherPlayerAborted = false;
    this.stateName = "WaitForOtherPlayer";
    
	this.play = function() {
        this.otherPlayerAborted = false;
        board.whoIsPlaying = board.tokenOtherPlayer();
        if (board.isMultiplayer) {
            $("#pageGameBoardState").html("Please Wait");
        } else {
            $("#pageGameBoardState").html("Computer plays");
            this.played(board.computerTurn);
        }
	}
	this.changeState = function() {
        if (this.otherPlayerAborted) {
            board.changeState(new GameOFFClass());
        } else if (board.gameOver) {
            board.changeState(new AnnounceWinnerClass());
        } else {
            board.changeState(new PlayTurnClass());
        }
	}
    this.clickHandler = function(cell) {
        alert("Current state is waiting for other player to play!");
    }
    this.remotePlayed = function(record) {
        var data = JSON.parse(record.JSONData__c);
        if (data.abort == true) {
            alert("Other user has aborted playing");
            board.gameOver = true;
            this.otherPlayerAborted = true;
            this.changeState();
        } else {
            var turn = new TurnClass();
            turn.byRemote(record);
            this.played(turn);
        }
    }
    this.played = function(turn) {
        turn.updateBoard();
        board.whoIsPlaying = board.tokenLocalPlayer;
        this.changeState();
    }
    this.stopWaitingAsk = function() {
        if (confirm("Do you want to abort?") == true) {
            this.stopWaiting();
        }
    }
    this.stopWaiting = function() {
        sfdc.abortWaitFriendPlays();
    }
}
function AnnounceWinnerClass() {
	this.stateName = "AnnounceWinner";

	this.play = function() {
        var msg = "Game Over\n";
        
        if (board.winner == board.vNull) {
            msg += "Tie game.";
        } else {
            msg += board.winner + " wins";
        }
        alert(msg);
		this.changeState();
	}
	this.changeState = function() {
		board.changeState(new GameOFFClass());
	}
}
function GameOFFClass() {
	this.stateName = "GameOFF";

	this.play = function() {
		this.changeState();
	}
	this.changeState = function() {
		board.changeState(new GameONClass());
	}
}

/* Notes on the State Machine...
This game uses the State design pattern with the following states:
GameON
AskUserToStart (Show welcome and start button)
ResetBoard
SelectMode (Single/Multi player)
if (Multi-player) {
	ServerConnect (If logged in, then just continue)
	SignIn
        SignUp (Maybe)
	FindPlayer
} else {
    ChooseToken (X or O)
}
repeat {
	PlayTurn
	CheckBoard (Next state can me either StartTurn or AnnounceWinner)
until (gameCompleted)
AnnounceWinner

// Maybe I'll have to just stop and do not repeat...
// Depends on how memory is handled and released in a state machine,
// the stack could grow huge :-)
if (PlayAgain) {
	ResetBoard
} else {
	GameOFF
}
*/