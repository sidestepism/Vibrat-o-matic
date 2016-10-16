var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SerialPort = require('serialport');

var defaultSerialPort = "/dev/tty.usbserial-A9O3R1XL"
var portName = process.argv.length > 2 ? process.argv[3] : defaultSerialPort;
var updateInterval = 30 // [msec]

// ensure f(0) = f(1) = 0
var envelopeFunction = {
	square: function(x) { return 1 },
	sin: function(x) { return Math.sin(x*Math.PI) },
	sin3: function(x) { return Math.pow(Math.sin(x*Math.PI), 3) },
	sinr3: function(x) { return Math.pow(Math.sin(x*Math.PI), 1/3) },
	sina: function(x) { return Math.sin(x*Math.PI)*1/2 + 1/2 },
}

app.use(express.static('static'));

app.get('/', function(req, res){
  res.sendFile('static/index.html');
});

io.on('connection', function(socket){
	console.log('a user connected');
	var updateIntervalTimer;

	socket.on('test', function (data) {
	var startDate = +(new Date())
	if (data.updateInterval) updateInterval = data.updateInterval

	if (data.envelopeFunction == 'default') {
		// default ならば
		send_command(3, data.strength, data.length)
	}else{
		if (!envelopeFunction[data.envelopeFunction]){
			console.log("no such envelope function:", data.envelopeFunction)
			return
		}
		if (updateIntervalTimer){
			clearInterval(updateIntervalTimer)
		}
		setInterval(function (arguments) {
			var currentDate = +(new Date())
			var elapsedRatio = (currentDate - startDate) / data.length
			if (elapsedRatio < 0 || elapsedRatio > 1){
				clearInterval(updateIntervalTimer)
				return
			}
			var intensity = Math.round(envelopeFunction[data.envelopeFunction](elapsedRatio) * data.strength)
			send_command(3, intensity, updateInterval)
		}, updateInterval)
	}
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

var openEMSstim = new SerialPort(portName, {
   baudRate: 57600,
   parser: SerialPort.parsers.readline("\n")
 });

// Register functions for handling the communication with openEMSstim
openEMSstim.on('open', showPortOpen);
openEMSstim.on('data', sendSerialData);
openEMSstim.on('close', showPortClose);
openEMSstim.on('error', showError);

function showPortOpen() {
	   // console.log('openEMSstim connected to serial port at data rate: ' + openEMSstim.options.baudRate);
}
 
function sendSerialData(data) {
	   // console.log(data);
}
 
function showPortClose() {
	   // console.log('openEMSstim connection to serial port closed.');
}
 
function showError(error) {
	   // console.log('Serial port error: ' + error);
}

//First validates a command, then if valid, sends it to the openEMSstim
function send_command(channel, intensity, duration) {
	var command = ""
	console.log("||||||||||||||||||||||||||||||".substring(0, Math.round(intensity / 3)))
	if (is_numeric(channel) && is_numeric(intensity) && is_numeric(duration)) {
		if (channel == 1 || channel == 2 || channel == 3) {
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
		command += "\n"
		// console.log("sending: " + command);
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

