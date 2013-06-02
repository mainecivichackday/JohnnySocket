var five = require("johnny-five");
var board  = new five.Board();
var util = require('util'),
    net = require('net');
// Global variables for active digital pins.
var BOOM = 13,
    HOIST = 11,
    BOAT = 12,
    TRUCK = 10,
    MAGNET = 9;
var SERVOS   = [BOOM, HOIST, BOAT, TRUCK];
    jServos = [];

function makeServo(opts) {
  var servo = new five.Servo(opts);
  servo.name = opts.pin;
  servo.on("move",function(err,degrees) {
    console.log('>>>> Servo '+servo.name+' at '+degrees);
    servo.pos = degrees;
  });
  jServos.push(servo);
  console.log('created Servo on pin '+opts.pin);
  return servo;
}

// Initialize array of Servo objects.
function setServos() {
  //BOOM
  var boomOpts = {pin:BOOM,
                  range:[0,90],
                  type:"standard",
                  //startAt:90,
                  center:false};
  var boom = makeServo(boomOpts);
  boom.move(90);
  //HOIST
  var hoistOpts = {pin:HOIST,
                  range:[0,180],
                  type:"standard",
                  //startAt:0,
                  center:false};
  var hoist = makeServo(hoistOpts);
  hoist.move(180);
  //BOAT
  var boatOpts = {pin:BOAT,
                  range:[0,360],
                  type:"continuous",
                  //startAt:0,
                  center:false};
  var boat = makeServo(boatOpts);
  //boat.move(89);
  //TRUCK
  var truckOpts = {pin:TRUCK,
                  range:[0,360],
                  type:"continuous",
                  //startAt:0,
                  center:false};
  var truck = makeServo(truckOpts);
  truck.move(0);
}

// Find Servo given a pin
function getServo(name) {
  var found = '';
  for (i in jServos) {
    if (jServos[i].name == name) {
      found = jServos[i];
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
    {host:'awesomesauce.me',port:'7124'},
   // {host:'localhost',port:'8130'},
    function() {//'connect' listener
      console.log('TCP client connected');
      client.write(JSON.stringify(boardDeets));
    }
  );
  
  var hbInterval = setInterval(heartbeat,5000,boardDeets,client);

  // Process data from TCP Server.
  client.on('data', function(data) {
    try {
      var udkCommand = data.toString();
      console.log('udkCommand: '+udkCommand);
      if (udkCommand == 'LEFT') {
        var boom = getServo(BOOM);
        console.log('CURRENT POS: '+boom.pos+'.');
        boom.min();
        console.log('moving to Left.');
      } else if (udkCommand == 'RIGHT') {
        var boom = getServo(BOOM);
        console.log('CURRENT POS: '+boom.pos+'.');
        boom.max();
        console.log('moving to Right.');
      } else if (udkCommand == 'UP') {
        var hoist = getServo(HOIST);
        console.log('CURRENT POS: '+hoist.pos+'.');
        hoist.max();
        console.log('moving upward.');
      } else if (udkCommand == 'DOWN') {
        var hoist = getServo(HOIST);
        console.log('CURRENT POS: '+hoist.pos+'.');
        hoist.min();
        console.log('moving downward.');
      } else if (udkCommand == 'BOAT') {
        var boat = getServo(BOAT);
        console.log('CURRENT POS: '+boat.pos+'.');
        boat.write(boat.pos+15);
        console.log('bon voyage!');
      } else {
        var data = JSON.parse(data.toString());
        console.log('Received TCP JSON data: '+util.inspect(data));
        if (data.component == 'servo') {
          var servo = getServo(data.pin);
          if (data.pos === 'min') {
            servo.max();
          } else if (data.pos === 'max') {
            servo.min();
          } else {
            servo.move(data.pos);
          }
        }
      }
    } catch (err) {
        console.log('Cannot process garbage.');
    }

   // client.end();
  });

  // Handle TCP end.
  client.on('end',function() {
    console.log('TCP client disconnected');
  });

});

console.log('Waiting for Arduino to be ready.');
