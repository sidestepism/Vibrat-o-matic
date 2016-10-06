var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var DEFAULT_SERIAL_COM = "/dev/tty.ABCDEF"
var serialCOM = process.argv.length > 2 ? process.argv[3] : DEFAULT_SERIAL_COM;

app.use(express.static('static'));

app.get('/', function(req, res){
  res.sendFile('index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('test', function (data) {
  	console.log(data);
  })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
