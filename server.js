//============ VARIABLES =====================
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io').listen(http);


//ARRAY TO STORE USER'S NAME LOGGED IN TO THE GAME
users = [];
//ARRAY TO STORE SOCKETS CONNECTED IN TO THE GAME
connections = [];
//ARRAY TO STORE SOCKETS CONNECTED IN TO THE GAME
choices = [];

let socketCount = 0;

//SERVING STATIC FILES IN EXPRESS
app.use(express.static("public"));

io.sockets.on('connection', function (socket) {
	//CONNECTED SOCKETS WILL BE PUSH ADDED TO THE CONECTIONS ARRAY
	connections.push(socket);
	//%s OUTPUTS STRING
	//IN CONSOLE LOG IT WILL SHOW CURRENT CONNECTED SOCKETS

	console.log('%s connected sockets', connections.length);

	socket.on('disconnect', function (data) {
		//WHEN USER DISCONNECTED THE LIST OF USERS. THE NAME WILL BE REMOVED AND IT WILL APPEAR OF DICONNECTED USERS.
		//ALSO THE COUNT OF USER WILL DECREASE ON CLIENT AND SERVER SIDE
		users.splice(users.indexOf(socket.username), 1);
		updateUsernames();
		//NUMBER OF CONNECTION/SOCKET WILL DECREASE IF A USER WAS DISCONNECTED TO THE GAME
		connections.splice(connections.indexOf(socket), 1)
		//USER WILL BE DISCONNECTED
		io.emit('disconnected', socket.username);
		console.log('%s disconnected sockets', connections.length);
	});

	//IF THERE'S ONLY ONE PLAYER IT WILL DISPLAY MESAGE THAT NEEDS ANOTHER PLAYER TO PLAY THE GAME
	if (connections.length < 2) {
		io.emit('need another player');
	}
	//IF THERE'S TWO PLAYERS CONNECTED THE GAME WILL START
	if (connections.length == 2) {
		io.emit('two players');
	}
	//WHEN THERE'S MORE THAN 2 CONNECTIONS USER WILL BE DISCONNECTED AND CAN'T ENTER THE GAME
	if (connections.length > 2) {
		io.emit('restrict 2 players');
		io.disconnect();
	}

	socket.on('add user', function (data, callback) {
		socket.username = data;

		if (users.indexOf(socket.username) > -1) {
			callback(false);
		} else {
			//IF THERE'S A LOGGED IN USER IT WILL BE PUSHED AND ADEDD TO THE ARRAY AND UPDATE THE LIST OF THE USERS ON CLIENT SIDE
			users.push(socket.username);
			//FUNCTION CALLED TO UPDATE THE USERNAME LIST IN THE GAME
			updateUsernames();
			callback(true);
			io.emit('connected', socket.username);
			io.emit('game start');
			//THIS RETURN AN ARRAY OF USERS AND DETERMINE THE LENGTH OF THE ARRAY. IF THE LENGHT IS EQUALS 2 USERS THEN THE GAME WILL START FOR BOTH USERS
			//IN CASE THERE MORE THAN TWO CONNECTED USERS ONLY FIRST TWO USERS CAN PLAY THE GAME AND THE GAME AREA WILL HIDDEN TO OTHER USERS CONNECTED
		}
	});

	socket.on('player choice', function (username, choice) {
		//CHOICES ARRAY WILL HAVE USER AND CHOICE PROPERTY WHEN USER'S NAME AND PICK WILL BE STORED AND DISPLAY ON CLIENT SIDE OF THE GAME
		choices.push({
			'user': username,
			'choice': choice
		});

		console.log('%s picked %s.', username, choice);

		if (choices.length == 2) {
			console.log('Both players have made choices.');
			// I'M HAVING HARD TIME TO MAKE THIS WORK SO I FOLLOWED THE TUTORIAL OR REFERENEC CODE THAT I SENT TO YOU.
			// FROM WHAT I UNDERSTOOD IF THE FIRST CHOICE IN THE ARRAY WILL BE COMPARED TO THE SECOND CHOICE IN THE ARRAY.
			//IF IT SATIFIES THE CONDITION IT WILL EMIT 'TIE' 'PLAYER 1 WIN' AND 'PLAYER 2 WIN'

			//TNOTE * HERE'S A BUG FOR VALUE OF '50''s IF  a user picked '100', '50' STILL WINS WHICH IM KINDA CONFUSED.
			switch (choices[0]['choice']) {
				case '10':
					switch (choices[1]['choice']) {
						case '10':
							io.emit('tie', choices);
							break;

						case '50':
							io.emit('player 2 win', choices);
							break;

						case '100':
							io.emit('player 2 win', choices);
							break;

						default:
							break;
					}
					break;

				case '50':
					switch (choices[1]['choice']) {
						case '10':
							io.emit('player 1 win', choices);
							break;

						case '50':
							io.emit('tie', choices);
							break;

						case '100':
							io.emit('player 2 win', choices);
							break;

						default:
							break;
					}
					break;

				case '100':
					switch (choices[1]['choice']) {
						case '10':
							io.emit('player 1 win', choices);
							break;

						case '50':
							io.emit('player 1 win', choices);
							break;

						case '100':
							io.emit('tie', choices);
							break;

						default:
							break;
					}
					break;

				default:
					break;
			}
			choices = [];
		}
	});
	//THIS IS FUNCTION IS TO EMIT GET USERS AND DISPLAY LIST OF CONNECTED USERS IN THE GAME
	function updateUsernames() {
		io.sockets.emit('get user', users);
	}
});

http.listen(process.env.PORT || 3000, function () {
	console.log('Waiting for players!');
});
