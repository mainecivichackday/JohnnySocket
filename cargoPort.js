var five = require("johnny-five");
var board  = new five.Board();
var util = require('util'),
    net = require('net');

// Global variables for active digital pins.
var pins   = [9, 10, 11],
    servos = [];

// Initialize array of Servo objects.
function setServos() {
  for (i in pins) {
    var pin = pins[i];
    var servo = new five.Servo(pin);
    servo.name = pin;
    servos.push(servo);
    console.log('created Servo on pin '+pin);
  };
}

// Find Servo given a pin
function getServo(name) {
  var found = '';
  for (i in servos) {
    if (servos[i].name == name) {
      found = servos[i];
    }
  }
  return found;
}

// Hearbeat tracking
var beats = 0;
function heartbeat(details,client) {
  details.sequence = beats;
  beats++;
  console.log(JSON.stringify(details));
  client.write(JSON.stringify(details));
}

// Define arduino behavior.
board.on("ready", function() {
  var boardDeets = {};
  boardDeets.uniqueId = "123456789XABCD";
  boardDeets.name = "CARGO_PORT";
  console.log('Board is ready');
  setServos();

  // Make TCP connection as client.
  var client = net.connect(
   // {host:'awesomesauce.me',port:'8130'},
    {host:'localhost',port:'8130'},
    function() {//'connect' listener
      console.log('TCP client connected');
      client.write(JSON.stringify(boardDeets));
    }
  );
  
  var hbInterval = setInterval(heartbeat,5000,boardDeets,client);

  // Process data from TCP Server.
  client.on('data', function(data) {
    var data = JSON.parse(data.toString());
    console.log('Received TCP data: '+util.inspect(data));
    var servo = getServo(data.pin);
    if (data.action === 'move') {
      console.log('moving '+led.name+' to position '+data.position+'.');
      servo.write(data.position);
    } else if (data.action === 'off') {
    }
   // client.end();
  });

  // Handle TCP end.
  client.on('end',function() {
    console.log('TCP client disconnected');
  });

});

console.log('Waiting for Arduino to be ready.');
