const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync('client/client.html');

const onRequest = (request, response) => {
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.write(index);
	response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log('Listening on 127.0.0.1: ${port}');

const io = socketio(app);

const users = {};

const onJoined = (sock) => {
	const socket = sock;
	
	socket.on('join', (data) => {
		
		users[data.name] = data.name;
		console.log(users);
		
		const joinMsg = {
			name: 'server',
			msg: 'There are ${Object.keys(users).length} users online',
		};
		
		socket.name = data.name;
		socket.emit('msg', joinMsg);
		
		socket.join('room1');
		
		const response = {
			name: 'server',
			msg: '${data.name} has joined the room.',
		};
		socket.broadcast.to('room1').emit('msg', response);
		
		console.log('${data.name} joined');
		socket.emit('msg', {name: 'server', msg: 'You joined the room'});
	});
};

const onMsg = (sock) => {
	const socket = sock;
	
	socket.on('msgToServer', (data) => {
		//console.log("Message sent: " + data);
		if(data.charAt(0) == "\\"){
			if(data.substring(0, 3) == "\\me"){
				data = socket.name + data.substring(3);
			}
			if(data.substring(0, 2) == "\\d"){
				data = "Rolled a D" + data.substring(2) + " and got: " + Math.floor((Math.random() * data.substring(2)) + 1);
			}
			if(data.substring(0, 4) == "\\num"){
				data = "There are " + Object.keys(users).length + " users here now";
			}
		}
		io.sockets.in('room1').emit('msg', { name: socket.name, msg: data });
		console.log("Users num: " + Object.keys(users).length);
		//socket.emit('msg', data);
	});
};

const onDisconnect = (sock) => {
	const socket = sock;
	socket.on('disconnect', () => {
		delete users[socket.name];
		console.log("delete event: " + users);
		socket.leave('room1');
		//delete users.socket.name;
	});
};

io.sockets.on('connection', (socket) => {
	console.log('started');
	
	onJoined(socket);
	onMsg(socket);
	onDisconnect(socket);
});

console.log('Websocket server started');