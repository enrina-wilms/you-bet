$(function () {
	var socket = io.connect();

	//=================== VARIABLES ==========================

	/******** USER FORM LOGIN ******************************************/
	var userFormArea = $('#user-form-area');
	var users = $('#users');
	var username = $('#username');
	var loginButton = $('#login-submit');
	/********* GAME AREA AND CHOICES AREA *****************************/
	var gameArea = $('#game-area');
	var game = $('#game');
	var prizeText = $('#prize-reveal-text');
	/********* ACTION BUTTONS *******/
	var prize = $('#prize');
	var reset = $('#reset');
	var quit = $('#quit');
	/********* ACTION BUTTONS CONTAINER AT THE END OF THE GAME *******/
	var resetCont = $('#choice-reset-container');
	var quitCont = $('#choice-quit-container');
	var prizeCont = $('#choice-prize-container');
	var prizeRevealCont = $('#choice-prize-reveal-container');
	/********* GAME RESULTS ON TOP SECTION **************************/
	var play1 = $('#play1');
	var play2 = $('#play2');
	var resultPlay1 = $('#result-play1');
	var resultPlay2 = $('#result-play2');
	var resultWinLose = $('#result-win-lose');
	var resultBg = $('.result-div');
	var resultText = $('.results-text');
	var resultReset = $('.results-text');
	var warning = $('#warning');
	var thisUser = "Anonymous";
	var submitted = false;

	//BOTTOM SECTION FOR GAME STATS AND USERS CONNECTED/DISCONNECTED
	var usersConnected = $('#users-con');
	var usersDconnected = $('#users-dcon');
	var countConUsers = $('#count-con-users');
	var countDisConUsers = $('#count-discon-users');
	var gameStats = $('#game-stats');
	var gameTextPlay1 = $('#game-status-player1');
	var gameTextPlay2 = $('#game-status-player2');

	//=================== EVEN LISTENERS ==========================
	// WHEN USER CLICK LOGIN BUTTON TO ENTER THE GAME
	userFormArea.submit(function (e) {
		e.preventDefault();

		socket.emit('add user', username.val(), function (data) {
			userFormArea.hide();
			gameArea.show();
			game.hide();
			prizeCont.hide();
			actionButtonHide();
		});

		username.val();
	});
	//WHEN USER CLICK SUMBIT AFTER PICKING MOVE
	game.submit(function (e) {
		e.preventDefault();
		var choice = $('input[name=choice]:checked').val();

		if (!submitted) {
			submitted = true;
			socket.emit('player choice', username.val(), choice);
			resultWinLose.html('Waiting...');
			gameStats.html('Waiting for other player...');
			prizeCont.hide();
		} else gameStats.html('You have already made a choice!');
	});

	/*
	 * WHEN GAME ENDS THERE WIL BE OPTION  FOR RESETTING OR QUITTING THE GAME
	 * IF THE USER CLICKED THE 'PLAY AGAIN' BUTTON, THE OPTION AND SELECTED MOVE WILL BE RESET/UNCHECKED
	 * IF THE USER CLICKED THE 'QUTI' BUTTON, IT WILL HIDE THE GAME AND STATUS AREA. THE USERFORM WILL SHOW AGAIN
	 * BUT FOR USERS TO BE LOGGED THEY NEED TO REFRESH THE PAGE CAUSE IT WILL NOT LOGGED IF YOU JUST TYPE YOUR NAME 
	 * AND LOGIN. THIS IS A BUG THAT I NEED TO FIX. I NEED TO REFRESH THE PAGE WITHOUT TELLING THE SERVER THAT USER IS CONNECTED OR 
	 * ANOTHER SOCKET IS CONNECTED INSTEAD OF BEING DISCONNECTED
	 */
	reset.on('click', function () {
		$('input[type=radio]').prop('checked', function () {
			return this.getAttribute('checked') == 'false';
		});
		//REMOVE THE CLASS STYLING FOR REVEALING THE WINNER OF THE BET
		resultBg.removeClass('winner-hightlight-bg');
		resultText.removeClass('winner-hightlight-text');
		resultText.html('Pick Now');
		resultWinLose.html('Waiting For Pick');
		resetCont.hide();
		actionButtonHide();
		hideMysteryPrize();
		game.show();
	})
	//ORIGINALLY THE REVEALING OF MYSTERY PRIZE IS THROUGH BUTTON BUT I'M HAVING HARD TIME TO HIDE IT TO OTHER USE WHO LOSE THE GAME, I WILL STILL WORK ON THIS ONE
	//	prize.click(function () {
	//		prizeRevealCont.show();
	//		prize.hide();
	//		//socket.emit('mystery prize');
	//	});

	//WHEN A USER CLICK THE 'QUIT' BUTTON IT WILL HIDE THE GAME AREA AND SHOW THEUSERFORM AREA
	quit.click(function () {
		userFormArea.show();
		gameArea.hide();
		game.hide();
		socket.emit('disconnect', thisUser);
		socket.disconnect();
	});

	//=================== SOCKETS LISTENERS ========================
	//WHEN THE USER IS CONNECTED THE NAME WILL BE ADDED TO THE LIST
	socket.on('connected', function (username) {
		gameStats.append(username + ' joined the game' + '<br>');
	});
	//WHEN THE USER DISCONNECTED THE NAME WILL BE REMOVED ON CONNECTED USERS AND ADDED TO DISCONNECTED USERS CONTAINER
	socket.on('disconnected', function (username) {
		gameStats.append(username + ' left the game' + '<br>');
		usersDconnected.append(username + '<br>');
	});
	//WHEN USER FIRST CONNECT IF THERE'S ONLY ONE YOU NEED TO WAIT FOR ANOTHER USER TO PLAY THE FAME
	socket.on('need another player', function () {
		warning.html('You will be the first player, Just wait for another player to start the game');
	});
	//WHEN IT DETECTS THAT THERE'S TWO CONNECTED USERS ALREADY THE GAME WILL START
	socket.on('two players', function () {
		warning.html('Hurry up! Get in now, to start the game');
	});
	//IF THERE'S MORE THAN TWO PLAYERS OR SOCKETS CONNECTED THEY WILL BE DISCONNECTED AND CAN'T PALY THE GAME 
	socket.on('restrict 2 players', function () {
		warning.html('Your late! two players already playing');
		socket.disconnect();
	});

	socket.on('get user', function (data) {
		var userList = '';

		for (i = 0; i < data.length; i++) {
			userList += data[i] + '<br>';
			play1.html(data[0]);
			play2.html(data[1]);
		}
		//DISPLAY THE NUMBER OF CONNECTED USERS
		countConUsers.html('( ' + data.length + ' )' + ' Connected Users');
		usersConnected.html(userList);
		//		warning.html('( ' + data.length + ' )' + ' Connected Users');
	});
	//WHEN TWO USERS ARE ALREADY CONNECTED THE GAME WILL START
	socket.on('game start', function () {
		game.show();
		prizeCont.hide();
		actionButtonHide();
		gameStats.append('Place your bet!.<br>');
		resultText.html('You Bet!');
		resultWinLose.html("Where's Bet?");
	});
	/********* WINNING CONDITIONS OF THE BET GAME *****************************/
	
	//WHEN PLAYERS HAD A TIE GAME
	socket.on('tie', function (choices) {
		countdown(choices);

		setTimeout(function () {
			gameStats.append('A tie!<br>');
			resultWinLose.html('A tie!');
			gameTextPlay1.addClass("winner-hightlight-bg");
			gameTextPlay2.addClass("winner-hightlight-bg");
			resultPlay1.addClass("winner-hightlight-text");
			resultPlay2.addClass("winner-hightlight-text");
			game.hide();
			actionButtonShow();
			getMysteryPrize();
		}, 2500);
		submitted = false;
	});
	//CONDITION IF PLAYER 1 WINS
	socket.on('player 1 win', function (choices) {
		countdown(choices);

		setTimeout(function () {
			gameStats.append('<br>' + choices[0]['user'] + ' wins!');
			resultWinLose.html(choices[0]['user'] + ' wins!');
			gameTextPlay1.addClass("winner-hightlight-bg");
			resultPlay1.addClass("winner-hightlight-text");
			game.hide();
			actionButtonShow();
			getMysteryPrize();
		}, 2500);
		submitted = false;
	});
	//CONDITION IF PLAYER 2 WINS
	socket.on('player 2 win', function (choices) {
		countdown(choices);

		setTimeout(function () {
			gameStats.append('<br>' + choices[1]['user'] + ' wins!');
			resultWinLose.html(choices[1]['user'] + ' wins!');
			gameTextPlay2.addClass("winner-hightlight-bg");
			resultPlay2.addClass("winner-hightlight-text");
			game.hide();
			actionButtonShow();
			getMysteryPrize();
		}, 2500);
		submitted = false;
	});
	// THIS CODE IS SUPPOSED TO BE SHOWING THE MYSTERY PRIZE BUT ITS NOT FULLY IMPLEMENTED CAUSE I WANT TO HIDE THIS TO THE PLAYER WHO LOSE THE GAME
	socket.on('mystery prize', function () {
		prizeCont.show();
		prizeText.html(mysteryPrize);
	});

	//THIS FUNCTION IS A COUNTDOWN WHEN BOTH PLAYERS ALREADY PICKED THEIR MOVE WITHIN FIVE SECONDS TEXT WILL DISPLAY IN GAME STATUS AREA AND WILL REVEAL THEIR PICKS AND WHO WILL WIN THE GAME
	function countdown(choices) {

		setTimeout(function () {
			resultText.html('$$$');
			resultWinLose.html(choices[0]['user'] + ' is set!');
		}, 0);
		setTimeout(function () {
			resultText.html('$$$');
			resultWinLose.html(choices[1]['user'] + ' is set!');
		}, 500);
		setTimeout(function () {
			resultWinLose.html('Who wins?');
		}, 1000);
		setTimeout(function () {
			//PLAYER 1 BET WILL BE REVEAL
			gameStats.html(choices[0]['user'] + ' bet ' + choices[0]['choice'] + '.');
			//resultPlay1.html(choices[0]['choice']);
			resultPlay1.html('<div class="choice-circle">' + '<span class="choice-icon">' + choices[0]['choice'] + '</span>' + '</div>');
		}, 1500);
		setTimeout(function () {
			//PLAYER 2 BET WILL BE REVEAL
			gameStats.append('<br>' + choices[1]['user'] + ' bet ' + choices[1]['choice'] + '.');
			//			resultPlay2.html(choices[1]['choice']);
			resultPlay2.html('<div class="choice-circle">' + '<span class="choice-icon">' + choices[1]['choice'] + '</span>' + '</div>');
		}, 2000);
	}
	//SHOW "PLAY AGAIN"  AND "QUIT" BUTTON AT THE END OF THE GAME
	function actionButtonShow() {
		//		prizeCont.show();
		resetCont.show();
		quitCont.show();
	}
	//HIDE "PLAY AGAIN"  AND "QUIT" BUTTON AT THE END OF THE GAME
	function actionButtonHide() {
		resetCont.hide();
		quitCont.hide();
	}
	//FUNCTION THAT WILL SHOW THE MYSTERY PRIZE
	function getMysteryPrize() {
		prizeRevealCont.show();
		prizeText.html(mysteryPrize);
	}
	//FUNTION THAT WILL HIDE THE MYSTERY PRIZE
	function hideMysteryPrize() {
		prizeRevealCont.hide();
	}
});
