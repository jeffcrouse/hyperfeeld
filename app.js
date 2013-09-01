
/**
 * Module dependencies.
 */

var express = require('express')
	, engine = require('ejs-locals')
	, http = require('http')
	, path = require('path')
	, mongoose = require('mongoose')
	, WebSocketServer = require('ws').Server
	, os = require("os")
	, fs = require("fs")
	, util = require("util")
	, readline = require('readline')
	, check = require('validator').check

/**
*	Configure database
*/
//mongoose.connect('mongodb://hyperfeel:pinguinshavefeelings@ds035237.mongolab.com:35237/hyperfeel');
mongoose.connect('mongodb://localhost/hyperfeel');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(err) {
	if(err) {
		console.log("Couldn't connect to database!")
		process.exit();
	} else {
		console.log("Connected to database.")
	}
});

var journeySchema = mongoose.Schema({
      created_at: { type: Date, default: Date.now }
    , client_id: String
    , email: { type: String }
    , readings: [{
    	  date: Date
    	, data: mongoose.Schema.Types.Mixed
    }]
    , events: [{
		  date: Date
		, eventType: String
		, data: mongoose.Schema.Types.Mixed
    }]
});
var Journey = mongoose.model('Journey', journeySchema);

/**
*	Configure app
*/
var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.engine('ejs', engine);
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('your secret here'));
	app.use(express.session());
	app.use(app.router);
	app.use(require('less-middleware')({ src: __dirname + '/public' }));
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

app.get('/', function(req, res){
	res.render("index", {});
});

app.get('/admin', function(req, res){
	var ws_url;
	switch(os.hostname()) {
		case "silo001": ws_url = "ws://brainz.io:8080"; break;
		default: ws_url = "ws://localhost:8080"; break;
	}
	console.log("ws_url="+ws_url);
	res.render("admin", {"ws_url": ws_url});
});

app.get('/simulator', function(req, res){
	var data = {"title": "Simulator"};
	/*
	data.colors = [
		  {"name": "Red", "hex": "FF6363"}
		, {"name": "Orange", "hex": "FFB62E"}
		, {"name": "Yellow", "hex": "DEDE40"}
		, {"name": "Green", "hex": "4FE63C"}
		, {"name": "Blue", "hex": "00B7C4"}
		, {"name": "Indigo", "hex": "8366D4"}
		, {"name": "Violet", "hex": "E33BCF"}
	];
	*/
	res.render("simulator", data);
});

app.get("/ping", function(req, res){
	var client_id = req.query.client_id;
	res.send("OK");
});

app.post('/submit/journey', function(req, res) {
	var json = req.body; 

	if(json.email!==null && json.email.length>0) 
	{
		try {
			check(json.email, 'Please enter a valid email').len(6,64).isEmail();
		} catch (e) {
			res.send({"status": e.message});
			return;
		}
	}

	var journey = new Journey({
		readings: json.readings, 
		events: json.events,
		client_id: json.client_id, 
		email: json.email,
		created_at: json.date
	});

	journey.save(function(err, doc){
		if(err) {
			res.send({"status": err});
			console.log(err)
		} else {
			res.send({"status": "OK"});
			viz_server.broadcast(JSON.stringify({"route": "addJourney", "journey": doc}));
		}
	});
});

app.post('/submit/video', function(req, res){
	if(!req.body.journey_id) {
		res.send({"status": "No journey_id provided"});
		return;
	}
	fs.readFile(req.files.video.path, function (err, data) {
		var newPath = util.format("%s/uploads/%s.mov", __dirname, req.body.journey_id);
		fs.writeFile(newPath, data, function (err) {
			res.send({"status": "OK"});
		});
	});
});

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});




/********************************************************************************************
           $$\                                                                              
           \__|                                                                             
$$\    $$\ $$\ $$$$$$$$\         $$$$$$$\  $$$$$$\   $$$$$$\ $$\    $$\  $$$$$$\   $$$$$$\  
\$$\  $$  |$$ |\____$$  |       $$  _____|$$  __$$\ $$  __$$\\$$\  $$  |$$  __$$\ $$  __$$\ 
 \$$\$$  / $$ |  $$$$ _/        \$$$$$$\  $$$$$$$$ |$$ |  \__|\$$\$$  / $$$$$$$$ |$$ |  \__|
  \$$$  /  $$ | $$  _/           \____$$\ $$   ____|$$ |       \$$$  /  $$   ____|$$ |      
   \$  /   $$ |$$$$$$$$\        $$$$$$$  |\$$$$$$$\ $$ |        \$  /   \$$$$$$$\ $$ |      
    \_/    \__|\________|$$$$$$\\_______/  \_______|\__|         \_/     \_______|\__|      
                         \______|                                                                                                                               
*********************************************************************************************/

var viz_clients = [];
var viz_server = new WebSocketServer({port: 8080});
console.log("visualization server running at ws://%s:8080", os.hostname());
viz_server.on('connection', function(client) {
	viz_clients.push( client );
	console.log("viz client connected");

	// Send all of the existing 
	var tick = setInterval(function(){
		var msg = {"route": "tick", "date": new Date()};
		client.send(JSON.stringify(msg), function(error){ if(error) console.log(error) });
	}, 1000);


	// ON MESSAGE
	client.on('message', function(message) {
		message = JSON.parse(message);

		if(message.route=="removeJourney") {
			console.log("removing "+message._id);
			Journey.remove({_id: message._id}, function(err){
				if (err) 
					client.send(JSON.stringify({"route": "error", "error": err}))
				else 
					client.send(JSON.stringify({"route": "removeJourney", "_id": message._id}))
			});
		}

		else if(message.route=="initMe") {
			console.log("sending all journeys...");
			Journey.find().sort({ created_at: 'asc'}).limit(30).exec(function(err, docs){
				if(err) {
					console.log(err)
				} else {
					docs.forEach(function(doc){
						client.send(JSON.stringify( {"route": "showJourney", "journey": doc}), function(error){ 
							if(error) console.log(error);
						});
					});
				}
			});
		}

		else if(message.route=="replayJourney") {
			var _id = message._id;
			Journey.findById(_id, function (err, doc) {
				if(err) {
					console.log(err);
				} else {
					console.log("replaying "+_id);
					viz_server.broadcast(JSON.stringify({"route": "replayJourney", "journey": doc}));
				}
			});
		}
	});

	// ON CLOSE
	client.on('close', function() {
		clearInterval(tick);
		var index = viz_clients.indexOf(client);
		if(index != -1) {
			console.log("removing client from list");
			viz_clients.splice(index, 1);
		}
		console.log("client closed.")
	});

	// ON ERROR
	client.on('error', function(err){
		console.log("error: "+err);
	})
});
viz_server.broadcast = function(message) {
	//console.log("Broadcasting: "+message);
	for(var i=0; i<viz_clients.length; i++) {
		viz_clients[i].send(message, function(err){
			if(err) console.log(err);
		})
	}
}





/*********************************************************************************************
  $$\                                                                                  
  $$ |                                                                                 
$$$$$$\    $$$$$$\          $$$$$$$\  $$$$$$\   $$$$$$\ $$\    $$\  $$$$$$\   $$$$$$\  
\_$$  _|  $$  __$$\        $$  _____|$$  __$$\ $$  __$$\\$$\  $$  |$$  __$$\ $$  __$$\ 
  $$ |    $$ /  $$ |       \$$$$$$\  $$$$$$$$ |$$ |  \__|\$$\$$  / $$$$$$$$ |$$ |  \__|
  $$ |$$\ $$ |  $$ |        \____$$\ $$   ____|$$ |       \$$$  /  $$   ____|$$ |      
  \$$$$  |\$$$$$$$ |       $$$$$$$  |\$$$$$$$\ $$ |        \$  /   \$$$$$$$\ $$ |      
   \____/  \____$$ |$$$$$$\\_______/  \_______|\__|         \_/     \_______|\__|      
          $$\   $$ |\______|                                                           
          \$$$$$$  |                                                                   
           \______/                                                                    
*********************************************************************************************/
/*
var tg_server = new WebSocketServer({port: 8081});
console.log("BrainProxy server running at ws://%s:8081", os.hostname());
tg_server.on('connection', function(client) {
	//tg_clients.push( client );

	var client_id = null;
	var update = function() {
		attention += (attentionTarget-attention) / 10.0;
		meditation += (meditationTarget-meditation) / 10.0;
	}
	var updateInterval = setInterval(update, 100);

	client.on('message', function(message) {
		var message = JSON.parse(message);
		
		if(message.route == "identify") {
			console.log("Client identified: %s", message.client_id);
			client_id = message.client_id;
		}

		if(message.route == "reading") {
			client_id = message.client_id;
			console.log("reading from %s", message.client_id);
			if(message.reading.eSenseMeditation) 
				meditationTarget = message.reading.eSenseMeditation;

			if(message.reading.eSenseAttention) 
				attentionTarget = message.reading.eSenseAttention;
		}

		if(message.route == "submit") {
			client_id = message.client_id;
			console.log("journey from %s", message.client_id);
			
			if(message.readings.length < 40) {
				client.send(JSON.stringify({"route": "saveStatus", "status": "not enough readings"}));
			} else {
				// If it arrives with "timestamp" property, convert it to a JS date
				if(message.timestamp) 
					message.date = new Date(message.timestamp*1000);
				
				// Do the same for all of the readings...
				message.readings.forEach(function(reading){
					if(reading.timestamp) 
						reading.date = new Date(reading.timestamp*1000);
				});
				
				// for(var i=0; i<message.readings.length; i++) {
				// 	if(message.readings[i].timestamp)
				// 		message.readings[i].date = new Date(message.readings[i].timestamp);
				// }
				var journey = new Journey({
					readings: message.readings, 
					client_id: parseInt(message.client_id), 
					email: message.email,
					created_at: message.date
				});

				journey.save(function(err, doc){
					if(err) {
						client.send(JSON.stringify({"route": "saveStatus", "status": err}));
						console.log(err)
					} else {
						client.send(JSON.stringify({"route": "saveStatus", "status": "OK"}));
						viz_server.broadcast(JSON.stringify({"route": "journey", "journey": doc}));
					}
				});
			}
		}
	});

	client.on('close', function() {
		clearInterval(updateInterval);
	});
});
*/

/**************************************************************************************
              $$\       $$\ $$\                            $$\                         
              \__|      $$ |\__|                           $$ |                        
$$$$$$\$$$$\  $$\  $$$$$$$ |$$\        $$$$$$$\  $$$$$$\ $$$$$$\   $$\   $$\  $$$$$$\  
$$  _$$  _$$\ $$ |$$  __$$ |$$ |      $$  _____|$$  __$$\\_$$  _|  $$ |  $$ |$$  __$$\ 
$$ / $$ / $$ |$$ |$$ /  $$ |$$ |      \$$$$$$\  $$$$$$$$ | $$ |    $$ |  $$ |$$ /  $$ |
$$ | $$ | $$ |$$ |$$ |  $$ |$$ |       \____$$\ $$   ____| $$ |$$\ $$ |  $$ |$$ |  $$ |
$$ | $$ | $$ |$$ |\$$$$$$$ |$$ |      $$$$$$$  |\$$$$$$$\  \$$$$  |\$$$$$$  |$$$$$$$  |
\__| \__| \__|\__| \_______|\__|      \_______/  \_______|  \____/  \______/ $$  ____/ 
                                                                             $$ |      
                                                                             $$ |      
                                                                             \__|      
**************************************************************************************/
/*
var CHANNEL_NOTE_OFF = 128;
var CHANNEL_NOTE_ON = 144;
var CHANNEL_CONTROL_CHANGE = 176;
var notes = { 
	C:  60, Cs: 61,
	D:  62, Ds: 63,
	E:  64,
	F:  65, Fs: 66,
	G:  67, Gs: 68,
	A:  69, As: 70,
	B:  71
}
var midiOut = new midi.output();
try {
	midiOut.openPort(0);
} catch(error) {
	midiOut.openVirtualPort('tg_server');
}
process.on("SIGTERM", function(){
	midiOut.closePort();
});
*/

/********************************************************************
                                    $$\ $$\ $$\                     
                                    $$ |$$ |\__|                    
 $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$$ |$$ |$$\ $$$$$$$\   $$$$$$\  
$$  __$$\ $$  __$$\  \____$$\ $$  __$$ |$$ |$$ |$$  __$$\ $$  __$$\ 
$$ |  \__|$$$$$$$$ | $$$$$$$ |$$ /  $$ |$$ |$$ |$$ |  $$ |$$$$$$$$ |
$$ |      $$   ____|$$  __$$ |$$ |  $$ |$$ |$$ |$$ |  $$ |$$   ____|
$$ |      \$$$$$$$\ \$$$$$$$ |\$$$$$$$ |$$ |$$ |$$ |  $$ |\$$$$$$$\ 
\__|       \_______| \_______| \_______|\__|\__|\__|  \__| \_______|
********************************************************************/                                                              
/*
var rl = readline.createInterface(process.stdin, process.stdout, null);
rl.setPrompt('> ');
rl.on('line', function(input) {
	input = input.split(" ");
	cmd = input[0];
	if(cmd=="midi") {
		var channel = parseInt(input[1]);
		var node = parseInt(input[2]);
		var vel = parseInt(input[3]);
		console.log("midi("+channel, note, vel+")");
		midiOut.sendMessage([channel, note, vel]);
	} else if(cmd=="user") {
		var client_id = parseInt(input[1]);
		switch(input[2]) {
			case "blink":
				var note = notes["C"] + (client_id * 12);
				var vel = 60+Math.floor(Math.random()*40);
				console.log("midi("+CHANNEL_NOTE_ON, note, vel+")");
				midiOut.sendMessage([CHANNEL_NOTE_ON, note, vel]);
				setTimeout(function(){
					console.log("midi("+CHANNEL_NOTE_OFF, note, vel+")");
					midiOut.sendMessage([CHANNEL_NOTE_OFF, note, vel]);
				}, 200);
				break;
			case "enter":
				var note = notes["D"] + (client_id * 12);
				
				break;
			case "exit":
				var note = notes["E"] + (client_id * 12);

				break;
			case "meditation":
				var note = notes["F"] + (client_id * 12);
				var vel = Math.floor(Math.random()*100);
				midiOut.sendMessage([CHANNEL_CONTROL_CHANGE, node, vel]);
				break;
			case "attention":
				var note = notes["G"] + (client_id * 12);
				var vel = Math.floor(Math.random()*100);
				midiOut.sendMessage([CHANNEL_CONTROL_CHANGE, node, vel]);
				break;
		}

	} else if(cmd=="quit") {
		rl.question('Are you sure? (y/n) ', function(answer) {
			if (answer === 'y') rl.close();
			else rl.prompt();
		});
	} else {
		console.log("command not recognized.");
	}

	rl.prompt();
});

rl.on('close', function() {
	console.log('Bye');
	midiOut.closePort();
	process.exit();
});
*/
