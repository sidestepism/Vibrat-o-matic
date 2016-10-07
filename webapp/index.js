var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SerialPort = require('serialport');

var DEFAULT_SERIAL_COM = "/dev/tty.usbserial-A9O3R1XL"
var portName = process.argv.length > 2 ? process.argv[3] : DEFAULT_SERIAL_COM;

app.use(express.static('static'));

app.get('/', function(req, res){
  res.sendFile('index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('test', function (data) {
  	console.log(data);
  	if (data.waveform == 0) {
	    send_command(1, data.strength, data.length);
  	}

  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

var openEMSstim = new SerialPort(portName, {
   baudRate: 19200,
   parser: SerialPort.parsers.readline("\n")
 });

// Register functions for handling the communication with openEMSstim
openEMSstim.on('open', showPortOpen);
openEMSstim.on('data', sendSerialData);
openEMSstim.on('close', showPortClose);
openEMSstim.on('error', showError);

function showPortOpen() {
	   console.log('openEMSstim connected to serial port at data rate: ' + openEMSstim.options.baudRate);
}
 
function sendSerialData(data) {
	   console.log(data);
}
 
function showPortClose() {
	   console.log('openEMSstim connection to serial port closed.');
}
 
function showError(error) {
	   console.log('Serial port error: ' + error);
}

//First validates a command, then if valid, sends it to the openEMSstim
function send_command(channel, intensity, duration) {
	var command = ""
	if (is_numeric(channel) && is_numeric(intensity) && is_numeric(duration)) {
		if (channel == 1 || channel == 2) {
			command = "C" + (channel -1);
		} else {
			console.log("ERROR: Command malformatted, will not send to openEMSstim");
			return null;
		}
		if (intensity >= 0 && intensity <= 100) {
			command += "I" + intensity; 
		} else {
			console.log("ERROR: Command malformatted, will not send to openEMSstim");
			return null;
		}
		if (duration >= 0) {
			command += "T" + duration + "G";
		} else {
			console.log("ERROR: Command malformatted, will not send to openEMSstim");
		}
		console.log("sending: " + command);
		openEMSstim.write(command);
	} else {
		console.log("ERROR: Command malformatted, will not send to openEMSstim");
		return null;
	}
}

function is_numeric(str){
	if (!isNaN(parseInt(str, 10))) return true;
	else return false;
}

